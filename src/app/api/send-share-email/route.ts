import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { toEmail, petName, ownerName, permission } = await request.json();

    // For now, we'll just log the email details
    // In a real app, you'd integrate with a service like SendGrid, Mailgun, etc.
    console.log('Email notification would be sent:', {
      to: toEmail,
      subject: `${ownerName} shared ${petName} with you`,
      body: `
        Hi there!
        
        ${ownerName} has shared their pet ${petName} with you on SharePetCare.
        
        Access Level: ${permission}
        
        You can now sign in to the app and view the shared pet.
        
        Visit: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
        
        Best regards,
        SharePetCare Team
      `
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email notification logged (would be sent in production)' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    );
  }
} 