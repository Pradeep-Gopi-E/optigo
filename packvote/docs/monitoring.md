# Monitoring and Analytics Setup

This document provides comprehensive monitoring setup for PackVote using free-tier tools.

## 📊 Grafana Cloud Setup

### 1. Create Grafana Cloud Account
1. Sign up at [grafana.com](https://grafana.com/)
2. Choose the free tier plan
3. Create a new stack

### 2. Configure Data Sources

#### Application Metrics (Prometheus)
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'packvote-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

#### Logs (Loki)
```python
# Add to backend/app/main.py
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge

# Metrics
REQUEST_COUNT = Counter('packvote_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('packvote_request_duration_seconds', 'Request duration')
ACTIVE_USERS = Gauge('packvote_active_users', 'Number of active users')
TRIPS_CREATED = Counter('packvote_trips_created_total', 'Total trips created')
VOTES_CAST = Counter('packvote_votes_cast_total', 'Total votes cast')
```

### 3. Key Metrics to Monitor

#### API Performance
- Request rate (requests/second)
- Response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- Database query performance

#### Business Metrics
- User registration rate
- Trip creation rate
- Survey completion rate
- Voting participation rate
- AI recommendation generation rate

#### System Health
- Memory usage
- CPU usage
- Database connections
- External API call success rates

## 📈 Dashboards

### Dashboard 1: API Overview
```
Panels:
- Request Rate (graph)
- Response Time (graph)
- Error Rate (graph)
- Active Users (stat)
- Requests by Endpoint (pie chart)
- Response Time Distribution (heatmap)
```

### Dashboard 2: Business Metrics
```
Panels:
- New Users (graph)
- Trips Created (graph)
- Survey Completion Rate (gauge)
- Voting Participation (graph)
- AI Recommendations Generated (graph)
- Popular Destinations (table)
```

### Dashboard 3: System Health
```
Panels:
- CPU Usage (graph)
- Memory Usage (graph)
- Database Connections (graph)
- External API Health (stat)
- Disk Usage (graph)
- Uptime (stat)
```

## 🚨 Alerts

### Critical Alerts
1. **High Error Rate**
   ```
   Condition: error_rate > 5% for 5 minutes
   Severity: Critical
   Action: Immediate investigation
   ```

2. **API Downtime**
   ```
   Condition: API not responding for 2 minutes
   Severity: Critical
   Action: Check deployment status
   ```

3. **Database Connection Issues**
   ```
   Condition: Database errors > 10/minute
   Severity: Critical
   Action: Check database health
   ```

### Warning Alerts
1. **Slow Response Times**
   ```
   Condition: p95 response time > 2 seconds for 10 minutes
   Severity: Warning
   Action: Performance investigation
   ```

2. **Low User Engagement**
   ```
   Condition: No new trips for 24 hours
   Severity: Warning
   Action: Review user experience
   ```

## 📱 Notification Channels

### Slack Integration
```bash
# Install Slack webhook
pip install slack-sdk

# Configure in Grafana
Settings → Alerts → Notification channels → Add Slack
```

### Email Notifications
```bash
# Configure SMTP in Grafana
Settings → Alerts → Notification channels → Add Email
```

### Discord/Telegram Bot
```python
# Custom webhook handler
import requests

def send_alert(message: str, webhook_url: str):
    payload = {"content": message}
    response = requests.post(webhook_url, json=payload)
    return response.status_code == 200
```

## 🔧 Implementation

### Backend Metrics Integration

```python
# backend/app/utils/monitoring.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import Request, Response
import time

# Metrics
REQUEST_COUNT = Counter('packvote_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('packvote_request_duration_seconds', 'Request duration')
ACTIVE_USERS = Gauge('packvote_active_users', 'Number of active users')
TRIPS_CREATED = Counter('packvote_trips_created_total', 'Total trips created')

async def monitoring_middleware(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    # Record metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_DURATION.observe(time.time() - start_time)

    return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### Frontend Error Tracking

```typescript
// frontend/src/lib/monitoring.ts
interface ErrorEvent {
  error: Error
  context: {
    userAgent: string
    url: string
    timestamp: number
    userId?: string
  }
}

class ErrorTracker {
  private errors: ErrorEvent[] = []

  capture(error: Error, context?: Partial<ErrorEvent['context']>) {
    const event: ErrorEvent = {
      error,
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        ...context
      }
    }

    this.errors.push(event)
    this.reportError(event)
  }

  private async reportError(event: ErrorEvent) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (err) {
      console.error('Failed to report error:', err)
    }
  }
}

export const errorTracker = new ErrorTracker()

// Global error handler
window.addEventListener('error', (event) => {
  errorTracker.capture(event.error, {
    component: 'global'
  })
})

window.addEventListener('unhandledrejection', (event) => {
  errorTracker.capture(new Error(event.reason), {
    component: 'promise'
  })
})
```

## 📊 Log Management

### Structured Logging
```python
# backend/app/utils/logging.py
import structlog
import logging

def setup_logging():
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
```

### Log Patterns
```python
# User actions
logger.info("user_login", user_id=user.id, email=user.email)
logger.info("trip_created", trip_id=trip.id, user_id=user.id)
logger.info("vote_cast", trip_id=trip.id, user_id=user.id)

# Performance
logger.info("api_request", method=request.method, path=path, duration=duration)
logger.info("ai_recommendation_generated", trip_id=trip.id, duration=duration)

# Errors
logger.error("database_error", error=str(e), query=query)
logger.error("ai_service_error", error=str(e), trip_id=trip_id)
```

## 📈 Analytics Implementation

### User Analytics
```python
# backend/app/utils/analytics.py
from datetime import datetime, timedelta
from sqlalchemy import func
from ..models import User, Trip, Vote, Preference

class AnalyticsService:
    def __init__(self, db):
        self.db = db

    def get_user_metrics(self, days=30):
        since = datetime.utcnow() - timedelta(days=days)

        new_users = self.db.query(User).filter(
            User.created_at >= since
        ).count()

        active_users = self.db.query(User).join(Trip).filter(
            Trip.created_at >= since
        ).distinct().count()

        return {
            "new_users": new_users,
            "active_users": active_users,
            "retention_rate": active_users / new_users if new_users > 0 else 0
        }

    def get_trip_metrics(self, days=30):
        since = datetime.utcnow() - timedelta(days=days)

        trips_created = self.db.query(Trip).filter(
            Trip.created_at >= since
        ).count()

        votes_cast = self.db.query(Vote).join(Trip).filter(
            Trip.created_at >= since
        ).count()

        return {
            "trips_created": trips_created,
            "votes_cast": votes_cast,
            "avg_votes_per_trip": votes_cast / trips_created if trips_created > 0 else 0
        }
```

### Frontend Analytics
```typescript
// frontend/src/lib/analytics.ts
interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: number
  userId?: string
}

class Analytics {
  private events: AnalyticsEvent[] = []

  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId: this.getUserId()
    }

    this.events.push(analyticsEvent)
    this.sendEvent(analyticsEvent)
  }

  private getUserId(): string | undefined {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user).id : undefined
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (err) {
      console.error('Failed to send analytics:', err)
    }
  }
}

export const analytics = new Analytics()

// Usage examples
analytics.track('page_view', { path: window.location.pathname })
analytics.track('trip_created', { trip_id: trip.id })
analytics.track('vote_cast', { trip_id: trip.id, vote_count: votes.length })
```

## 🎯 KPIs and Success Metrics

### Activation Metrics
- User registration rate
- First trip creation within 24 hours
- Survey completion rate

### Engagement Metrics
- Daily active users
- Trips per user
- Votes per trip
- Session duration

### Retention Metrics
- 7-day retention rate
- 30-day retention rate
- Churn rate

### Business Metrics
- User growth rate
- Trip success rate
- AI recommendation usage
- Telegram bot adoption

## 🔄 Automated Reporting

### Daily Reports
```python
# backend/tasks/daily_report.py
def generate_daily_report():
    metrics = analytics_service.get_daily_metrics()

    report = f"""
    Daily PackVote Report
    =====================

    📈 Growth
    - New Users: {metrics['new_users']}
    - Active Users: {metrics['active_users']}

    🎯 Engagement
    - Trips Created: {metrics['trips_created']}
    - Votes Cast: {metrics['votes_cast']}
    - Survey Completion: {metrics['survey_completion_rate']}%

    🤖 AI Usage
    - Recommendations Generated: {metrics['ai_recommendations']}
    - Success Rate: {metrics['ai_success_rate']}%

    📱 Telegram
    - Survey Invitations Sent: {metrics['telegram_invitations']}
    - Completion Rate: {metrics['telegram_completion_rate']}%
    """

    send_slack_notification(report)
```

This comprehensive monitoring setup ensures you have visibility into all aspects of your PackVote application, from technical performance to user engagement and business metrics.