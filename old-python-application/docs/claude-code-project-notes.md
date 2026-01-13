# Claude Code Project Format Notes

These are my notes from analyzing several Claude Code projects.

## Overview

All Claude Code projects live in ~/.claude/projects, with one project directory per project

Each project directory contains a set of JSONL files, with one file per user session
- There is also one file per subagent task invoked by a user session

## Session Files
Each session file is a JSONL file, where each line represents one message/event from the session.

Here is an example line from one session file (`c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f.jsonl`), which I've indented to make more readable (the actual file has all this data on one line though)

```json
{
  "parentUuid": null,
  "isSidechain": false,
  "userType": "external",
  "cwd": "/home/joseph/projects/claude-skills-testing",
  "sessionId": "c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f",
  "version": "2.0.61",
  "gitBranch": "",
  "type": "user",
  "message": {
    "role": "user",
    "content": "Please use the brainstorming skill to process the following spec.\n\nLet's make a basic chat server.\n\nThe chat server shuld be written in Python and use TCP to communicate. Users will connect with netcat or telnet, nothing fancy.\n\nThe chat server should 'feel' like an IRC server, but does not need to strictly adhere to RFC 1459. That being said, I've copied RFC 1459 for your reference into chat-server/docs\n\nPut all code in ./chat-server/\n\nI want to support the following commands/features:\n\nUser features:\n- USER\n- NICK\n- no passwords. all users will be authenticated solely on the basis of USER. the only restriction is that each unoque username may only have one instance at a time, although a nickname may be reused.\n\nChannel features:\n- we will have channels on the server. all channels will be unauthenticated, so any user may join any server.\n- JOIN: joins an existing channel, or creates one if none exists with that name yet.\n- PART: leaves the currentl channel\n- TOPIC: sets the current channel's topic.\n- NAMES\n- LIST\n\nMessages:\n- PRIVMSG\n\nUser:\n- WHOIS\n\nI also highly recommend you go through ./chat-server/docs/rfc-1459.txt to parse out the above commands. for each IRC command above, I recommend making on sub-document, containing just the content for that command, and saving your sub-document in ./chat-server/docs (e.g., ./chat-server/docs/WHOIS.txt). That will make it significiantly easier to retrieve inforamtion in the future."
  },
  "uuid": "9f5491e8-b6ad-4a31-9166-d14ded689acc",
  "timestamp": "2025-12-07T21:05:16.273Z",
  "thinkingMetadata": {
    "level": "high",
    "disabled": false,
    "triggers": []
  },
  "todos": []
}
```

- parentUuid: the uuid of the previous message
- isSidechain: indicates whether this message belongs to a subagent's session (true) or the primary Claude Code agent's session (false)
- userType: unknown, I've only ever seen "external"
- cwd: the current directory of the Claude Code session (this is also the directory the project ran in)
- sessionId: the UUID of the Claude Code session (this should also be the name of the file)
- version: Claude Code version
- gitBranch: the git branch of the session, if any
- type: unknown, I've seen both "user" and "message", although it's hard to separate the outer "type" parameters from a similar parameter inside certain messages
- message: the content of the message. parsing this information is the primary purpose of the tool
- uuid: the UUID of the current message (will be the parentUuid of the next message)
- timestamp: self-explanatory
- thinkingMetadata: unknown
- todos: any pending/complete todos, created by the TodoWrite tool

## Subagent Files

Subagent files are also JSONL files in the project directory, but their naming convention is different. 

Here is an example line from: `agent-2f346c7f.jsonl`, which I've indented to make more readable (the actual file has all this data on one line though):

```json
{
  "parentUuid": "4140ea3b-21af-470f-8f63-288e5d621393",
  "isSidechain": true,
  "userType": "external",
  "cwd": "/home/joseph/projects/claude-skills-testing",
  "sessionId": "c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f",
  "version": "2.0.61",
  "gitBranch": "",
  "agentId": "2f346c7f",
  "slug": "precious-humming-acorn",
  "message": {
    "model": "claude-haiku-4-5-20251001",
    "id": "msg_019Sw5jcWGm6G3DxYnNvFgrM",
    "type": "message",
    "role": "assistant",
    "content": [
      {
        "type": "tool_use",
        "id": "toolu_011Skzo76mCd8gyaxbm2Yzee",
        "name": "Grep",
        "input": {
          "pattern": "4\\.2\\.5.*NAMES",
          "path": "/home/joseph/projects/claude-skills-testing/chat-server/docs/rfc-1459.txt",
          "output_mode": "content",
          "head_limit": 200
        }
      }
    ],
    "stop_reason": null,
    "stop_sequence": null,
    "usage": {
      "input_tokens": 6,
      "cache_creation_input_tokens": 154,
      "cache_read_input_tokens": 12093,
      "cache_creation": {
        "ephemeral_5m_input_tokens": 154,
        "ephemeral_1h_input_tokens": 0
      },
      "output_tokens": 153,
      "service_tier": "standard"
    }
  },
  "requestId": "req_011CVt3Uwr7vNDzJbUesb1LD",
  "type": "assistant",
  "uuid": "9a382c0e-fecf-44a7-8f07-c706738ee136",
  "timestamp": "2025-12-07T21:33:41.727Z"
}
```

Most of this should look familiar. 

Subagent sessions may be linked to the primary session via the `agentId` parameter, which will be present in the tool result message of the primary session. The tool result message may be linked to a tool use message with its tool ID. 

For example, in the session above, the primary agent decided to invoke a subagent here:

```json
{
  "parentUuid": "b65e67d1-63ac-4787-ac23-7b4fec27f9d9",
  "isSidechain": false,
  "userType": "external",
  "cwd": "/home/joseph/projects/claude-skills-testing",
  "sessionId": "c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f",
  "version": "2.0.61",
  "gitBranch": "",
  "slug": "precious-humming-acorn",
  "message": {
    "model": "claude-sonnet-4-5-20250929",
    "id": "msg_01V9xGpFjqNfPDUU373ar73R",
    "type": "message",
    "role": "assistant",
    "content": [
      {
        "type": "tool_use",
        "id": "toolu_019FkigWjLcCTpbwWjTvKtXc",
        "name": "Task",
        "input": {
          "subagent_type": "general-purpose",
          "description": "Extract NAMES command docs",
          "prompt": "Read /home/joseph/projects/claude-skills-testing/chat-server/docs/rfc-1459.txt and extract ONLY the section about the NAMES command (section 4.2.5). Write it to /home/joseph/projects/claude-skills-testing/chat-server/docs/NAMES.txt. Include the command syntax, description, numeric replies, and examples from the RFC.",
          "model": "haiku"
        }
      }
    ],
    "stop_reason": null,
    "stop_sequence": null,
    "usage": {
      "input_tokens": 8,
      "cache_creation_input_tokens": 4755,
      "cache_read_input_tokens": 31294,
      "cache_creation": {
        "ephemeral_5m_input_tokens": 4755,
        "ephemeral_1h_input_tokens": 0
      },
      "output_tokens": 8,
      "service_tier": "standard"
    }
  },
  "requestId": "req_011CVt3Swr4XBvebNLA4Yr2y",
  "type": "assistant",
  "uuid": "9326763b-29ac-4001-a840-55c9103d36a6",
  "timestamp": "2025-12-07T21:33:31.226Z"
}
```

We see the tool ID: `toolu_019FkigWjLcCTpbwWjTvKtXc`.

Later, the subagent completed its task and returned the results to the primary agent:

```json
{
  "parentUuid": "dd516021-b695-4bd7-8a3f-d02afd0636fb",
  "isSidechain": false,
  "userType": "external",
  "cwd": "/home/joseph/projects/claude-skills-testing",
  "sessionId": "c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f",
  "version": "2.0.61",
  "gitBranch": "main",
  "slug": "precious-humming-acorn",
  "type": "user",
  "message": {
    "role": "user",
    "content": [
      {
        "tool_use_id": "toolu_019FkigWjLcCTpbwWjTvKtXc",
        "type": "tool_result",
        "content": [
          {
            "type": "text",
            "text": "Perfect! I have successfully extracted section 4.2.5 (Names message) from RFC 1459 and written it to the output file.\n\n## Summary\n\nThe NAMES command section has been extracted from the RFC 1459 document and saved to `/home/joseph/projects/claude-skills-testing/chat-server/docs/NAMES.txt`.\n\nThe file includes:\n- **Command syntax**: `NAMES [<channel>{,<channel>}]`\n- **Description**: Explains that the NAMES command lists all visible nicknames on specified channels or all channels if no parameter is given\n- **Numeric replies**: \n  - `353 RPL_NAMREPLY` - Returns the channel name and list of nicknames with optional operator/voice prefixes\n  - `366 RPL_ENDOFNAMES` - Marks the end of the NAMES list\n- **Usage notes**: Details about visibility rules for private/secret channels and behavior when no parameters are provided\n- **Examples**: Two practical examples showing how to query specific channels or all channels"
          }
        ]
      }
    ]
  },
  "uuid": "160a95f8-5ed0-49ea-8f17-698e72590d86",
  "timestamp": "2025-12-07T21:34:01.004Z",
  "toolUseResult": {
    "status": "completed",
    "prompt": "Read /home/joseph/projects/claude-skills-testing/chat-server/docs/rfc-1459.txt and extract ONLY the section about the NAMES command (section 4.2.5). Write it to /home/joseph/projects/claude-skills-testing/chat-server/docs/NAMES.txt. Include the command syntax, description, numeric replies, and examples from the RFC.",
    "agentId": "2f346c7f",
    "content": [
      {
        "type": "text",
        "text": "Perfect! I have successfully extracted section 4.2.5 (Names message) from RFC 1459 and written it to the output file.\n\n## Summary\n\nThe NAMES command section has been extracted from the RFC 1459 document and saved to `/home/joseph/projects/claude-skills-testing/chat-server/docs/NAMES.txt`.\n\nThe file includes:\n- **Command syntax**: `NAMES [<channel>{,<channel>}]`\n- **Description**: Explains that the NAMES command lists all visible nicknames on specified channels or all channels if no parameter is given\n- **Numeric replies**: \n  - `353 RPL_NAMREPLY` - Returns the channel name and list of nicknames with optional operator/voice prefixes\n  - `366 RPL_ENDOFNAMES` - Marks the end of the NAMES list\n- **Usage notes**: Details about visibility rules for private/secret channels and behavior when no parameters are provided\n- **Examples**: Two practical examples showing how to query specific channels or all channels"
      }
    ],
    "totalDurationMs": 25398,
    "totalTokens": 16515,
    "totalToolUseCount": 7,
    "usage": {
      "input_tokens": 3,
      "cache_creation_input_tokens": 635,
      "cache_read_input_tokens": 15640,
      "cache_creation": {
        "ephemeral_5m_input_tokens": 635,
        "ephemeral_1h_input_tokens": 0
      },
      "output_tokens": 237,
      "service_tier": "standard"
    }
  }
}
```

see the `agentId` parameter above: `2f346c7f`. The subagent's session would be stored in the `agent-2f346c7f.jsonl` file. 