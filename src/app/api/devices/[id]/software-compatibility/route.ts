// API Route: /api/devices/[id]/software-compatibility
// Handles software compatibility requirements for devices

import { NextRequest, NextResponse } from 'next/server';
import {
  addSoftwareCompatibility,
  getDeviceSoftwareCompatibility,
  checkSystemCompatibility
} from '@/lib/services/software-compatibility-service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id: deviceId } = params;
    const searchParams = request.nextUrl.searchParams;

    const softwareType = searchParams.get('type') as any;
    const checkSystem = searchParams.get('checkSystem') === 'true';

    if (checkSystem) {
      // Check compatibility with user's system
      const os = searchParams.get('os');
      const osVersion = searchParams.get('osVersion');
      const architecture = searchParams.get('architecture');

      if (!os || !osVersion || !architecture) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing system information: os, osVersion, architecture'
          },
          { status: 400 }
        );
      }

      const compatibility = await checkSystemCompatibility(deviceId, {
        os,
        osVersion,
        architecture
      });

      return NextResponse.json({
        success: true,
        data: compatibility
      });
    }

    const requirements = await getDeviceSoftwareCompatibility(deviceId, softwareType);

    return NextResponse.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    console.error('Error in GET /api/devices/[id]/software-compatibility:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch software compatibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id: deviceId } = params;
    const body = await request.json();

    const {
      softwareType,
      name,
      version,
      minVersion,
      maxVersion,
      platform,
      architecture,
      required,
      downloadUrl,
      notes
    } = body;

    // Validation
    if (!softwareType || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: softwareType, name'
        },
        { status: 400 }
      );
    }

    const compatibility = await addSoftwareCompatibility({
      deviceId,
      softwareType,
      name,
      version,
      minVersion,
      maxVersion,
      platform,
      architecture,
      required,
      downloadUrl,
      notes
    });

    if (!compatibility) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to add software compatibility'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: compatibility
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/devices/[id]/software-compatibility:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add software compatibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
