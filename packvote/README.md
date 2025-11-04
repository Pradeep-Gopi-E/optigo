# PackVote - AI-Assisted Group Trip Planner

PackVote is an innovative platform that makes group trip planning simple and fair through AI-powered recommendations and ranked-choice voting.

## 🌟 Features

### Core Functionality
- **Trip Creation**: Create and manage group trips with detailed planning
- **AI Recommendations**: Generate personalized destination suggestions using Google Gemini AI
- **Preference Collection**: Gather structured preferences from all trip participants
- **Ranked-Choice Voting**: Fair decision-making using instant-runoff voting algorithm
- **Telegram Integration**: Collect preferences and send notifications via Telegram bot

### Free-Tier Architecture
- **Backend**: FastAPI hosted on Render free tier
- **Database**: Supabase PostgreSQL (free tier)
- **Frontend**: Next.js deployed on Vercel free tier
- **AI**: Google Gemini 1.5 Flash (free credits)
- **Bot**: Telegram Bot API (free)
- **Monitoring**: Grafana Cloud free tier

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Supabase account
- Google AI Studio account
- Telegram Bot account

### Backend Setup

1. **Clone and Setup**
```bash
git clone <repository>
cd packvote/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Create Supabase project
# Update DATABASE_URL and SUPABASE_* variables in .env
```

4. **Run Backend**
```bash
cd app
python main.py
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Environment Configuration**
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

3. **Run Frontend**
```bash
npm run dev
```

## 📋 Environment Variables

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `JWT_SECRET`: Secret for JWT token signing
- `GOOGLE_AI_API_KEY`: Google AI Studio API key
- `TELEGRAM_BOT_TOKEN`: Telegram bot token

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`: Telegram bot username

## 🏗️ Architecture

### Backend API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile

#### Trip Management
- `GET /api/trips` - List user's trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/{id}` - Get trip details
- `PUT /api/trips/{id}` - Update trip
- `DELETE /api/trips/{id}` - Delete trip

#### Preferences
- `GET /api/trips/{id}/preferences` - Get trip preferences
- `POST /api/trips/{id}/preferences` - Submit preferences
- `GET /api/trips/{id}/preferences/survey` - Get user's survey
- `POST /api/trips/{id}/preferences/survey` - Complete survey

#### Recommendations
- `GET /api/trips/{id}/recommendations` - Get recommendations
- `POST /api/trips/{id}/recommendations/generate` - Generate AI recommendations
- `POST /api/trips/{id}/recommendations` - Add custom recommendation

#### Voting
- `GET /api/trips/{id}/votes` - Get all votes
- `POST /api/trips/{id}/votes` - Cast ranked-choice votes
- `GET /api/trips/{id}/votes/results` - Get voting results
- `GET /api/trips/{id}/votes/my-votes` - Get user's votes

#### Telegram Bot
- `POST /api/telegram/webhook` - Telegram bot webhook
- `POST /api/telegram/send-survey-invitation` - Send survey invitations
- `POST /api/telegram/send-voting-notification` - Send voting notifications

### Database Schema

#### Core Tables
- **users**: User accounts and profiles
- **trips**: Trip information and settings
- **participants**: Trip participation and roles
- **preferences**: User preference data (JSON)
- **recommendations**: AI and custom recommendations
- **votes**: Ranked-choice voting data

## 🤖 AI Integration

### Recommendation Generation
The system uses Google Gemini 1.5 Flash to generate personalized recommendations:

1. **Input Collection**: Gather all participant preferences
2. **Prompt Construction**: Build structured prompt with preference data
3. **AI Processing**: Send to Gemini with JSON schema enforcement
4. **Response Validation**: Parse and validate AI response
5. **Storage**: Store recommendations in database

### Fallback System
If AI service is unavailable, the system provides curated fallback recommendations for popular destinations.

## 📱 Telegram Bot

### Commands
- `/start` - Welcome and introduction
- `/survey <trip_id>` - Start preference survey
- `/status` - Check survey completion status
- `/help` - Show help information

### Features
- Interactive preference collection
- Progress tracking
- Survey completion notifications
- Voting reminders

## 🗳️ Voting System

### Instant-Runoff Algorithm
1. Count first-choice votes for each recommendation
2. Check for majority (>50%)
3. Eliminate option with fewest votes
4. Redistribute votes to next preferences
5. Repeat until winner determined

### Features
- Drag-and-drop ranking interface
- Real-time result calculation
- Anonymous voting display
- Complete audit trail

## 🚀 Deployment

### Backend (Render)
1. Connect repository to Render
2. Set environment variables
3. Deploy as web service
4. Configure health checks

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set environment variables
3. Deploy as Next.js application
4. Configure custom domain

### Database (Supabase)
1. Create new project
2. Run schema migrations
3. Configure Row Level Security
4. Set up authentication

### Monitoring (Grafana Cloud)
1. Create Grafana Cloud account
2. Configure data sources
3. Set up dashboards
4. Configure alerts

## 🔧 Development

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Code Style
```bash
# Backend formatting
black app/
isort app/

# Frontend linting
npm run lint
npm run format
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## 📊 Monitoring

### Key Metrics
- API response times and error rates
- Database query performance
- AI service usage and costs
- User engagement metrics
- Telegram bot interaction rates

### Grafana Dashboards
- API performance monitoring
- Database health metrics
- User activity tracking
- System resource usage

## 🔒 Security

### Data Protection
- Password hashing with bcrypt
- JWT token authentication
- HTTPS for all communications
- Input sanitization and validation
- SQL injection prevention

### Privacy Controls
- Minimal data collection
- Automatic data cleanup after 90 days
- GDPR-compliant data handling
- Row-level security in database

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests if applicable
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the FAQ section

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- Basic trip management
- AI recommendations
- Voting system
- Telegram integration

### Phase 2: Enhanced Features
- Real-time pricing integration
- Calendar synchronization
- Advanced filtering
- Mobile optimization

### Phase 3: Advanced Features
- Multi-currency support
- Weather integration
- Travel document reminders
- Group expense tracking