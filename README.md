# PokerWKD - Senior Scaffolding Complete

Your project is ready with a professional Dockerized setup.

## Project Structure
- **/server**: Node.js + TypeScript + Socket.io (Pure Logic in `src/core`)
- **/client**: React + Vite + Tailwind CSS (Mobile Optimized)
- **/redis**: Used for game state persistence.

## How to Run (Local or Linux Server)

1. **Install Docker & Docker Compose** on your system.
2. **Clone/Navigate** to the project folder.
3. **Run the following command**:
   ```bash
   docker-compose up --build
   ```
4. **Access the App**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:4000](http://localhost:4000)

## Tech Highlights
- **Mobile First**: Viewport locked, large touch targets, premium gradients.
- **WebSocket Foundation**: Ready for real-time moves.
- **Type Safety**: Shared interfaces between Front and Back.
- **Redis Ready**: Scalable state management.

Enjoy building your Poker empire!
