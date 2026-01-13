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
