"""Exceptions used by the AI layer."""


class AIError(Exception):
    """Base exception for AI-related failures."""


class LLMError(AIError):
    """Raised when the LLM request fails."""


class LLMValidationError(AIError):
    """Raised when the LLM response fails validation."""


class AgentError(AIError):
    """Raised when an AI agent fails."""