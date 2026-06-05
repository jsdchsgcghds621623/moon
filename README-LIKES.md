# Netflix Clone - Like System

## Starting the Like Server

The like system requires a separate Node.js server to handle like data persistence. 

### Method 1: Direct Start
```bash
node server.js
```

### Method 2: Using Start Script
```bash
node start-server.js
```

The server will start on `http://localhost:5001` and provide:
- `GET /api/movie/likes?movieId=123` - Get like count for a movie
- `POST /api/movie/like` - Like a movie (body: `{"movieId": "123"}`)

## Features
- ✅ Persistent like storage in `likes.json`
- ✅ Spam prevention via localStorage
- ✅ Real-time like count updates
- ✅ Toast notifications for feedback
- ✅ Responsive design across all screen sizes

## Troubleshooting

If you see "Failed to like" errors:
1. Make sure the server is running: `node server.js`
2. Check that port 5001 is available
3. Look at browser console for detailed error logs
4. Check server console for request logs

The server includes comprehensive logging to help debug any issues.