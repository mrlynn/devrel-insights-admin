import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';

interface SlackInsight {
  type: string;
  text: string;
  sentiment: string;
  priority: string;
  productAreas: string[];
  tags: string[];
  eventName?: string;
  sessionTitle?: string;
  advocateName: string;
  location?: string;
  capturedAt: string;
}

/**
 * POST /api/slack/post - Post an insight to Slack
 */
export async function POST(request: NextRequest) {
  if (!SLACK_WEBHOOK_URL) {
    return NextResponse.json(
      { error: 'Slack webhook not configured' },
      { status: 503 }
    );
  }

  try {
    const insight: SlackInsight = await request.json();

    // Build Slack message with blocks for rich formatting
    const sentimentEmoji = 
      insight.sentiment === 'Positive' ? '😊' :
      insight.sentiment === 'Negative' ? '😟' : '😐';
    
    const priorityEmoji =
      insight.priority === 'Critical' ? '🔴' :
      insight.priority === 'High' ? '🟠' :
      insight.priority === 'Medium' ? '🟡' : '⚪';

    const slackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${sentimentEmoji} New Insight: ${insight.type}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `> ${insight.text}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sentiment:*\n${sentimentEmoji} ${insight.sentiment}`,
            },
            {
              type: 'mrkdwn',
              text: `*Priority:*\n${priorityEmoji} ${insight.priority}`,
            },
            {
              type: 'mrkdwn',
              text: `*Product Areas:*\n${insight.productAreas.join(', ') || 'None'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Captured By:*\n${insight.advocateName}`,
            },
          ],
        },
        ...(insight.eventName ? [{
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📍 *Event:* ${insight.eventName}${insight.location ? ` (${insight.location})` : ''}${insight.sessionTitle ? ` • ${insight.sessionTitle}` : ''}`,
            },
          ],
        }] : []),
        ...(insight.tags.length > 0 ? [{
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `🏷️ ${insight.tags.map(t => `\`${t}\``).join(' ')}`,
            },
          ],
        }] : []),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_Captured ${new Date(insight.capturedAt).toLocaleString()}_`,
            },
          ],
        },
      ],
    };

    // Post to Slack
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Slack webhook error:', error);
      return NextResponse.json(
        { error: 'Failed to post to Slack' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Slack post error:', error);
    return NextResponse.json(
      { error: 'Failed to post to Slack' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/slack/post - Check if Slack is configured
 */
export async function GET() {
  return NextResponse.json({
    configured: Boolean(SLACK_WEBHOOK_URL),
  });
}
