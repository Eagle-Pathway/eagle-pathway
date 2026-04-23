import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, service, gradeLevel, targetCountry, message } = body;

    if (!firstName || !lastName || !email || !service) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Contact form submission:', {
      name: `${firstName} ${lastName}`,
      email,
      phone,
      service,
      gradeLevel,
      targetCountry,
      message,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}