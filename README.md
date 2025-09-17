# Device Compatibility Platform

A universal system for device compatibility and discovery across multiple ecosystems (gaming, PC, appliances, smart home, IoT). Similar to PCPartPicker but expanded beyond PC components.

## Features

- **Device Library Management**: Add and manage personal device collections
- **Standards-Based Compatibility**: Intelligent compatibility analysis using technical standards
- **Advanced Search**: Search by precise technical constraints and dimensions
- **AI-Assisted Data Population**: Automated device data extraction from various sources
- **Crowdsourced Verification**: Community-driven data accuracy and verification
- **Multi-Category Support**: Gaming, PC, appliances, and IoT devices

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Fastify, PostgreSQL, Redis
- **Database**: Prisma ORM with PostgreSQL
- **AI Processing**: Python microservice with Ollama/OpenAI
- **Infrastructure**: Docker, Vercel, Railway/Render

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (or use Docker)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd device-compatibility-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development environment with Docker:
```bash
npm run docker:dev
```

5. Set up the database:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Development Commands

```bash
# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open Prisma Studio

# Docker
npm run docker:dev       # Start development containers
npm run docker:down      # Stop containers
npm run docker:build     # Build containers

# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking
```

## Project Structure

```
/
├── src/                 # Source code
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   ├── lib/           # Utility libraries
│   └── types/         # TypeScript type definitions
├── prisma/             # Database schema and migrations
├── config/             # Configuration files
├── docker/             # Docker configuration
├── public/             # Static assets
└── .kiro/              # Kiro IDE configuration
```

## Database Schema

The application uses a PostgreSQL database with the following main entities:

- **Users**: User accounts and authentication
- **Devices**: Device catalog with specifications
- **Standards**: Technical standards (HDMI, USB-C, etc.)
- **DeviceStandards**: Device-standard relationships
- **CompatibilityRules**: Compatibility logic between standards
- **UserDevices**: User's personal device library
- **VerificationItems**: Crowdsourced data verification

## API Documentation

API documentation will be available at `/api/docs` when the application is running.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
