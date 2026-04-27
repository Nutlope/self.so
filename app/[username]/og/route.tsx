import { NextRequest } from 'next/server';
import { getUserData } from '../utils';
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadFont(): ArrayBuffer {
  const fontPath = join(process.cwd(), 'public', 'Inter.ttf');
  const buffer = readFileSync(fontPath);
  return new Uint8Array(buffer).buffer;
}

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.pathname.split('/')[1];

    const { user_id, resume, clerkUser } = await getUserData(username);

    if (!user_id || !resume?.resumeData || resume.status !== 'live') {
      return new Response('User not found', { status: 404 });
    }

    const name = (resume?.resumeData?.header?.name || 'User').slice(0, 100);
    const role = (resume?.resumeData?.header?.shortAbout || '').slice(0, 200);
    const location = (resume?.resumeData?.header?.location || '').slice(0, 100);
    const website = `www.self.so/${username}`.slice(0, 200);
    const profileImageUrl = clerkUser?.imageUrl;

    let fontData: ArrayBuffer;
    try {
      fontData = loadFont();
    } catch (e) {
      console.error('[OG] Font load error:', e);
      return new Response('Failed to load font', { status: 500 });
    }

    const svg = await satori(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            padding: '80px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'absolute',
              top: 60,
              left: 80,
              right: 0,
              paddingRight: 40,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src="https://self.so/logo.svg"
                alt="Self.so Logo"
                style={{ width: '144px', height: '46px' }}
              />
            </div>
            <div style={{ fontSize: '24px', color: '#666', textAlign: 'right' }}>
              {location}
            </div>
          </div>

          <div style={{ display: 'flex', width: '100%', marginTop: '40px', height: '480px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                width: '60%',
                paddingRight: '40px',
              }}
            >
              <h1
                style={{
                  fontSize: '72px',
                  fontWeight: 600,
                  margin: '0 0 20px 0',
                  color: '#222',
                  lineHeight: 1.1,
                }}
              >
                {name}
              </h1>
              <p style={{ fontSize: '32px', color: '#444', margin: 0, lineHeight: 1.4 }}>
                {role && role?.length > 90 ? `${role?.substring(0, 90)}...` : role}
              </p>
            </div>

            <div
              style={{
                width: '40%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={profileImageUrl || 'https://self.so/placeholder.svg'}
                alt="Profile"
                style={{ width: '360px', height: '360px', borderRadius: '16px', objectFit: 'cover' }}
              />
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 20, fontSize: '24px', color: '#666' }}>
            {website}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Inter', data: fontData, style: 'normal', weight: 400 },
          { name: 'Inter', data: fontData, style: 'normal', weight: 600 },
        ],
      }
    );

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    return new Response(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e: any) {
    console.error('[OG] Error:', e.message, e.stack);
    return new Response(`OG Error: ${e.message}`, { status: 500 });
  }
}
