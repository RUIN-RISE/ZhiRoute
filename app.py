from main import app
import uvicorn
import os

if __name__ == "__main__":
    # Ensure port 7860 for ModelScope
    uvicorn.run(app, host="0.0.0.0", port=7860)
