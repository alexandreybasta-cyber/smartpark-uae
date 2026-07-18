from fastapi import APIRouter, HTTPException
from schemas import AgentTextRequest, AgentTextResponse
from agent import process_agent_request

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/text", response_model=AgentTextResponse)
async def agent_text(request: AgentTextRequest):
    """Process text input through the AI agent."""
    try:
        return await process_agent_request(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
