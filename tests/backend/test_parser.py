"""Tests for JSONL metadata parser."""
import json
from pathlib import Path
import pytest
from visualizer.parser import extract_first_user_message, parse_session_preview


@pytest.fixture
def sample_jsonl():
    """Return path to sample JSONL fixture."""
    return Path(__file__).parent / 'fixtures' / 'sample-session.jsonl'


def test_extract_first_user_message(sample_jsonl):
    """Test extracting first user message from JSONL file."""
    preview = extract_first_user_message(sample_jsonl)
    assert preview == "Please help me implement authentication"


def test_extract_first_user_message_truncates_long_text():
    """Test that long messages are truncated to 100 chars."""
    import tempfile
    long_message = "a" * 200

    with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
        json.dump({
            "uuid": "msg-001",
            "message": {"role": "user", "content": long_message}
        }, f)
        f.write('\n')
        temp_path = Path(f.name)

    try:
        preview = extract_first_user_message(temp_path)
        assert len(preview) == 103  # 100 chars + "..."
        assert preview.endswith("...")
    finally:
        temp_path.unlink()


def test_extract_first_user_message_empty_file():
    """Test handling of empty JSONL file."""
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
        temp_path = Path(f.name)

    try:
        preview = extract_first_user_message(temp_path)
        assert preview == "(No user message)"
    finally:
        temp_path.unlink()


def test_extract_first_user_message_no_user_messages():
    """Test file with only assistant messages."""
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
        json.dump({
            "uuid": "msg-001",
            "message": {"role": "assistant", "content": "Hello"}
        }, f)
        f.write('\n')
        temp_path = Path(f.name)

    try:
        preview = extract_first_user_message(temp_path)
        assert preview == "(No user message)"
    finally:
        temp_path.unlink()


def test_parse_session_preview(sample_jsonl):
    """Test parsing full session preview metadata."""
    metadata = parse_session_preview(sample_jsonl, 'c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f')

    assert metadata['sessionId'] == 'c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f'
    assert metadata['preview'] == "Please help me implement authentication"
    assert metadata['messageCount'] == 3
    assert metadata['filePath'] == 'c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f.jsonl'
    assert 'timestamp' in metadata


def test_parse_session_preview_handles_malformed_json():
    """Test handling of malformed JSONL lines."""
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
        f.write('{"uuid":"msg-001","message":{"role":"user","content":"Good line"}}\n')
        f.write('{invalid json}\n')  # Malformed line
        f.write('{"uuid":"msg-002","message":{"role":"user","content":"Another line"}}\n')
        temp_path = Path(f.name)

    try:
        metadata = parse_session_preview(temp_path, 'test-session')
        # Should still extract preview from first valid line
        assert metadata['preview'] == "Good line"
        # Message count should be 2 (only valid lines)
        assert metadata['messageCount'] == 2
    finally:
        temp_path.unlink()
