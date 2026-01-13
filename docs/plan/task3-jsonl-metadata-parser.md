# Task 3: JSONL Metadata Parser

**Files:**
- Create: `claude-code-visualizer/src/visualizer/parser.py`
- Create: `claude-code-visualizer/tests/backend/test_parser.py`
- Create: `claude-code-visualizer/tests/backend/fixtures/sample-session.jsonl`

**Step 1: Create test fixture**

Create `claude-code-visualizer/tests/backend/fixtures/sample-session.jsonl`:

```jsonl
{"uuid":"msg-001","parentUuid":null,"timestamp":"2025-12-07T10:00:00Z","message":{"role":"user","content":"Please help me implement authentication"}}
{"uuid":"msg-002","parentUuid":"msg-001","timestamp":"2025-12-07T10:00:05Z","message":{"role":"assistant","content":"I'll help you implement authentication."}}
{"uuid":"msg-003","parentUuid":"msg-002","timestamp":"2025-12-07T10:00:10Z","message":{"role":"user","content":"Let's start with JWT tokens"}}
```

**Step 2: Write the failing test**

Create `claude-code-visualizer/tests/backend/test_parser.py`:

```python
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
```

**Step 3: Run tests to verify they fail**

```bash
pytest tests/backend/test_parser.py -v
```

Expected: FAIL with "ModuleNotFoundError: No module named 'visualizer.parser'"

**Step 4: Write minimal parser implementation**

Create `claude-code-visualizer/src/visualizer/parser.py`:

```python
"""Parser for JSONL session metadata extraction."""
import json
from pathlib import Path
from typing import Dict


def extract_first_user_message(jsonl_file: Path, max_length: int = 100) -> str:
    """
    Extract first user message from JSONL file for preview.

    Args:
        jsonl_file: Path to JSONL session file
        max_length: Maximum length of preview text (default: 100)

    Returns:
        Preview text, truncated if longer than max_length
    """
    if not jsonl_file.exists():
        return "(No user message)"

    try:
        with jsonl_file.open('r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                try:
                    data = json.loads(line)
                    message = data.get('message', {})

                    # Check if this is a user message
                    if message.get('role') == 'user':
                        content = message.get('content', '')

                        # Handle both string and array content formats
                        if isinstance(content, list):
                            # Extract text from content array
                            text_parts = [
                                item.get('text', '')
                                for item in content
                                if isinstance(item, dict) and item.get('type') == 'text'
                            ]
                            content = ' '.join(text_parts)

                        # Truncate if needed
                        if len(content) > max_length:
                            return content[:max_length] + "..."
                        return content

                except json.JSONDecodeError:
                    # Skip malformed lines
                    continue

    except Exception:
        return "(No user message)"

    return "(No user message)"


def parse_session_preview(jsonl_file: Path, session_id: str) -> Dict:
    """
    Parse session file to extract metadata for session list.

    Args:
        jsonl_file: Path to JSONL session file
        session_id: Session UUID

    Returns:
        Dict with sessionId, preview, messageCount, filePath, timestamp
    """
    preview = extract_first_user_message(jsonl_file)

    # Count valid lines
    message_count = 0
    try:
        with jsonl_file.open('r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    json.loads(line)
                    message_count += 1
                except json.JSONDecodeError:
                    # Skip malformed lines
                    continue
    except Exception:
        pass

    return {
        'sessionId': session_id,
        'preview': preview,
        'messageCount': message_count,
        'filePath': f'{session_id}.jsonl',
        'timestamp': jsonl_file.stat().st_mtime
    }
```

**Step 5: Run tests to verify they pass**

```bash
pytest tests/backend/test_parser.py -v
```

Expected: PASS - All tests should pass

**Step 6: Commit**

```bash
git add src/visualizer/parser.py tests/backend/test_parser.py tests/backend/fixtures/
git commit -m "feat: implement JSONL metadata parser for session previews"
```
