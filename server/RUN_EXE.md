# Running spare-parts-server.exe

## Quick Start

1. **Set up environment variables**
   - Copy `.env.example` to `.env` in the same folder as the .exe
   - Update the values with your actual database credentials

2. **Run the executable**

   ```bash
   .\spare-parts-server.exe
   ```

3. **Access the application**
   - Open browser to `http://localhost:5000` (or your configured PORT)

## Environment Variables

Create a `.env` file in the same directory as `spare-parts-server.exe`:

```
PORT=5000
DATABASE_URL="your_postgresql_url"
DIRECT_URL="your_direct_postgresql_url"
JWT_SECRET="your-secret-key-here"
CLIENT_ORIGIN="http://localhost:5000"
NODE_ENV=production
```

### Required Variables:

- **DATABASE_URL**: PostgreSQL connection string (Prisma URL)
- **DIRECT_URL**: Direct PostgreSQL connection URL
- **JWT_SECRET**: Secret key for JWT tokens (use a long random string)
- **PORT**: Server port (default: 5000)
- **CLIENT_ORIGIN**: CORS origin (set to the URL where the client is hosted)

## First Run Setup

Before running the exe for the first time, ensure:

1. Database is created and accessible
2. Environment variables are properly configured
3. `.env` file is in the same directory as the .exe

## Troubleshooting

- **Port already in use**: Change the `PORT` value in `.env`
- **Database connection error**: Verify `DATABASE_URL` and `DIRECT_URL` are correct
- **CORS errors**: Update `CLIENT_ORIGIN` in `.env`

## Notes

- The exe includes the built React frontend (served from `/` route)
- API endpoints are available under `/api/`
- The application uses Prisma ORM for database operations
- All dependencies are bundled into the single .exe file - no additional installation needed!
