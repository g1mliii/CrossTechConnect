/**
 * Category Template System - Predefined templates for common device categories
 */

import { CategoryTemplate, CategorySchema, FieldDefinition } from './types';

export class CategoryTemplateManager {
  private templates: Map<string, CategoryTemplate> = new Map();

  constructor() {
    this.initializeBuiltInTemplates();
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): CategoryTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): CategoryTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Register a new template
   */
  registerTemplate(template: CategoryTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Search templates by tags or name
   */
  searchTemplates(query: string, tags?: string[]): CategoryTemplate[] {
    const allTemplates = Array.from(this.templates.values());
    
    return allTemplates.filter(template => {
      const matchesQuery = !query || 
        template.name.toLowerCase().includes(query.toLowerCase()) ||
        template.description.toLowerCase().includes(query.toLowerCase());
      
      const matchesTags = !tags || tags.length === 0 ||
        tags.some(tag => template.tags?.includes(tag));
      
      return matchesQuery && matchesTags;
    });
  }

  /**
   * Initialize built-in templates
   */
  private initializeBuiltInTemplates(): void {
    // Gaming Console Template
    this.registerTemplate({
      id: 'gaming-console',
      name: 'Gaming Console',
      description: 'Template for gaming consoles (PlayStation, Xbox, Nintendo Switch, etc.)',
      baseSchema: {
        fields: {
          ...this.getBaseDeviceFields(),
          generation: {
            type: 'string',
            constraints: { required: true },
            metadata: {
              label: 'Console Generation',
              description: 'Generation or version of the console',
              importance: 'high',
              weight: 0.8
            }
          },
          maxResolution: {
            type: 'enum',
            constraints: {
              enum: ['720p', '1080p', '1440p', '4K', '8K']
            },
            metadata: {
              label: 'Maximum Resolution',
              description: 'Highest supported video resolution',
              importance: 'high',
              weight: 0.9
            }
          },
          hdrSupport: {
            type: 'array',
            constraints: {},
            metadata: {
              label: 'HDR Support',
              description: 'Supported HDR formats',
              importance: 'medium',
              weight: 0.6
            }
          },
          storageCapacity: {
            type: 'number',
            constraints: { min: 0, unit: 'GB' },
            metadata: {
              label: 'Storage Capacity',
              description: 'Internal storage capacity in GB',
              importance: 'medium',
              weight: 0.7
            }
          },
          wirelessStandards: {
            type: 'array',
            metadata: {
              label: 'Wireless Standards',
              description: 'Supported wireless connectivity standards',
              importance: 'medium',
              weight: 0.5
            }
          }
        },
        requiredFields: ['name', 'brand', 'generation', 'maxResolution'],
        compatibilityRules: [
          {
            id: 'console-tv-resolution',
            name: 'Console TV Resolution Compatibility',
            description: 'Check if console resolution is supported by TV',
            sourceField: 'maxResolution',
            targetField: 'maxResolution',
            condition: 'this.getResolutionValue(source) <= this.getResolutionValue(target)',
            compatibilityType: 'full',
            message: 'Console resolution is supported by display'
          }
        ]
      },
      tags: ['gaming', 'console', 'entertainment'],
      popularity: 95
    });

    // Monitor/Display Template
    this.registerTemplate({
      id: 'monitor-display',
      name: 'Monitor/Display',
      description: 'Template for computer monitors, TVs, and displays',
      baseSchema: {
        fields: {
          ...this.getBaseDeviceFields(),
          screenSize: {
            type: 'number',
            constraints: { min: 1, max: 200, unit: 'inches' },
            metadata: {
              label: 'Screen Size',
              description: 'Diagonal screen size in inches',
              importance: 'high',
              weight: 0.8
            }
          },
          resolution: {
            type: 'string',
            constraints: { required: true },
            metadata: {
              label: 'Native Resolution',
              description: 'Native display resolution',
              importance: 'critical',
              weight: 1.0
            }
          },
          refreshRate: {
            type: 'array',
            metadata: {
              label: 'Refresh Rates',
              description: 'Supported refresh rates in Hz',
              importance: 'high',
              weight: 0.9
            }
          },
          panelType: {
            type: 'enum',
            constraints: {
              enum: ['IPS', 'VA', 'TN', 'OLED', 'QLED', 'Mini-LED', 'Micro-LED']
            },
            metadata: {
              label: 'Panel Technology',
              description: 'Display panel technology',
              importance: 'medium',
              weight: 0.6
            }
          },
          colorGamut: {
            type: 'object',
            metadata: {
              label: 'Color Gamut Coverage',
              description: 'Color space coverage percentages',
              importance: 'medium',
              weight: 0.5
            }
          },
          hdrFormats: {
            type: 'array',
            metadata: {
              label: 'HDR Formats',
              description: 'Supported HDR formats',
              importance: 'high',
              weight: 0.8
            }
          },
          inputPorts: {
            type: 'array',
            metadata: {
              label: 'Input Ports',
              description: 'Available input connections',
              importance: 'high',
              weight: 0.9
            }
          },
          vesaMount: {
            type: 'string',
            metadata: {
              label: 'VESA Mount Pattern',
              description: 'VESA mounting hole pattern',
              importance: 'low',
              weight: 0.3
            }
          }
        },
        requiredFields: ['name', 'brand', 'screenSize', 'resolution'],
        validationRules: [
          {
            id: 'screen-size-resolution',
            name: 'Screen Size Resolution Validation',
            description: 'Validate that resolution is appropriate for screen size',
            condition: 'this.validateScreenSizeResolution(screenSize, resolution)',
            errorMessage: 'Resolution may not be optimal for this screen size',
            severity: 'warning'
          }
        ]
      },
      tags: ['display', 'monitor', 'tv', 'screen'],
      popularity: 90
    });

    // Audio Device Template
    this.registerTemplate({
      id: 'audio-device',
      name: 'Audio Device',
      description: 'Template for headphones, speakers, and audio equipment',
      baseSchema: {
        fields: {
          ...this.getBaseDeviceFields(),
          driverSize: {
            type: 'number',
            constraints: { min: 1, max: 200, unit: 'mm' },
            metadata: {
              label: 'Driver Size',
              description: 'Audio driver diameter in mm',
              importance: 'medium',
              weight: 0.6
            }
          },
          frequencyResponse: {
            type: 'string',
            metadata: {
              label: 'Frequency Response',
              description: 'Frequency response range (e.g., 20Hz-20kHz)',
              importance: 'high',
              weight: 0.8
            }
          },
          impedance: {
            type: 'number',
            constraints: { min: 1, max: 1000, unit: 'ohms' },
            metadata: {
              label: 'Impedance',
              description: 'Electrical impedance in ohms',
              importance: 'high',
              weight: 0.9
            }
          },
          sensitivity: {
            type: 'number',
            constraints: { unit: 'dB/mW' },
            metadata: {
              label: 'Sensitivity',
              description: 'Audio sensitivity rating',
              importance: 'medium',
              weight: 0.7
            }
          },
          connectionType: {
            type: 'enum',
            constraints: {
              enum: ['3.5mm', '6.35mm', 'XLR', 'USB', 'Bluetooth', 'Wireless']
            },
            metadata: {
              label: 'Connection Type',
              description: 'Primary connection method',
              importance: 'critical',
              weight: 1.0
            }
          },
          wirelessCodecs: {
            type: 'array',
            metadata: {
              label: 'Wireless Codecs',
              description: 'Supported wireless audio codecs',
              importance: 'medium',
              weight: 0.6
            }
          },
          noiseCancellation: {
            type: 'enum',
            constraints: {
              enum: ['None', 'Passive', 'Active', 'Hybrid']
            },
            metadata: {
              label: 'Noise Cancellation',
              description: 'Type of noise cancellation',
              importance: 'medium',
              weight: 0.5
            }
          }
        },
        requiredFields: ['name', 'brand', 'connectionType'],
        compatibilityRules: [
          {
            id: 'audio-impedance-power',
            name: 'Audio Impedance Power Matching',
            description: 'Check if amplifier can drive headphone impedance',
            sourceField: 'impedance',
            targetField: 'maxImpedance',
            condition: 'source <= target',
            compatibilityType: 'full',
            message: 'Amplifier can drive these headphones'
          }
        ]
      },
      tags: ['audio', 'headphones', 'speakers', 'sound'],
      popularity: 85
    });

    // Cable/Connector Template
    this.registerTemplate({
      id: 'cable-connector',
      name: 'Cable/Connector',
      description: 'Template for cables, adapters, and connectors',
      baseSchema: {
        fields: {
          ...this.getBaseDeviceFields(),
          connectorA: {
            type: 'string',
            constraints: { required: true },
            metadata: {
              label: 'Connector A',
              description: 'First connector type',
              importance: 'critical',
              weight: 1.0
            }
          },
          connectorB: {
            type: 'string',
            constraints: { required: true },
            metadata: {
              label: 'Connector B',
              description: 'Second connector type',
              importance: 'critical',
              weight: 1.0
            }
          },
          cableLength: {
            type: 'number',
            constraints: { min: 0, unit: 'meters' },
            metadata: {
              label: 'Cable Length',
              description: 'Physical cable length in meters',
              importance: 'medium',
              weight: 0.6
            }
          },
          maxDataRate: {
            type: 'number',
            constraints: { unit: 'Gbps' },
            metadata: {
              label: 'Maximum Data Rate',
              description: 'Maximum data transfer rate',
              importance: 'high',
              weight: 0.9
            }
          },
          powerDelivery: {
            type: 'number',
            constraints: { unit: 'watts' },
            metadata: {
              label: 'Power Delivery',
              description: 'Maximum power delivery capacity',
              importance: 'high',
              weight: 0.8
            }
          },
          signalType: {
            type: 'enum',
            constraints: {
              enum: ['Digital', 'Analog', 'Power', 'Mixed']
            },
            metadata: {
              label: 'Signal Type',
              description: 'Type of signal carried',
              importance: 'medium',
              weight: 0.7
            }
          }
        },
        requiredFields: ['name', 'brand', 'connectorA', 'connectorB'],
        compatibilityRules: [
          {
            id: 'cable-connector-match',
            name: 'Cable Connector Matching',
            description: 'Check if cable connectors match device ports',
            sourceField: 'connectorA',
            targetField: 'inputPorts',
            condition: 'target.includes(source)',
            compatibilityType: 'full',
            message: 'Cable connector matches device port'
          }
        ]
      },
      tags: ['cable', 'connector', 'adapter', 'wire'],
      popularity: 75
    });

    // Smartphone Template
    this.registerTemplate({
      id: 'smartphone',
      name: 'Smartphone',
      description: 'Template for smartphones and mobile devices',
      baseSchema: {
        fields: {
          ...this.getBaseDeviceFields(),
          operatingSystem: {
            type: 'string',
            constraints: { required: true },
            metadata: {
              label: 'Operating System',
              description: 'Mobile operating system',
              importance: 'high',
              weight: 0.8
            }
          },
          screenSize: {
            type: 'number',
            constraints: { min: 3, max: 10, unit: 'inches' },
            metadata: {
              label: 'Screen Size',
              description: 'Display diagonal size in inches',
              importance: 'high',
              weight: 0.8
            }
          },
          batteryCapacity: {
            type: 'number',
            constraints: { unit: 'mAh' },
            metadata: {
              label: 'Battery Capacity',
              description: 'Battery capacity in mAh',
              importance: 'medium',
              weight: 0.7
            }
          },
          chargingPorts: {
            type: 'array',
            metadata: {
              label: 'Charging Ports',
              description: 'Available charging port types',
              importance: 'high',
              weight: 0.9
            }
          },
          wirelessCharging: {
            type: 'boolean',
            metadata: {
              label: 'Wireless Charging',
              description: 'Supports wireless charging',
              importance: 'medium',
              weight: 0.5
            }
          },
          storageOptions: {
            type: 'array',
            metadata: {
              label: 'Storage Options',
              description: 'Available storage capacities',
              importance: 'medium',
              weight: 0.6
            }
          },
          cameras: {
            type: 'object',
            metadata: {
              label: 'Camera Specifications',
              description: 'Camera details and capabilities',
              importance: 'medium',
              weight: 0.5
            }
          }
        },
        requiredFields: ['name', 'brand', 'operatingSystem', 'screenSize']
      },
      tags: ['mobile', 'smartphone', 'phone', 'device'],
      popularity: 95
    });

    // Laptop Template
    this.registerTemplate({
      id: 'laptop',
      name: 'Laptop Computer',
      description: 'Template for laptop computers and notebooks',
      baseSchema: {
        fields: {
          ...this.getBaseDeviceFields(),
          processor: {
            type: 'string',
            constraints: { required: true },
            metadata: {
              label: 'Processor',
              description: 'CPU model and specifications',
              importance: 'critical',
              weight: 1.0
            }
          },
          memory: {
            type: 'number',
            constraints: { unit: 'GB' },
            metadata: {
              label: 'RAM',
              description: 'System memory in GB',
              importance: 'high',
              weight: 0.9
            }
          },
          storage: {
            type: 'object',
            metadata: {
              label: 'Storage',
              description: 'Storage configuration details',
              importance: 'high',
              weight: 0.8
            }
          },
          graphics: {
            type: 'string',
            metadata: {
              label: 'Graphics',
              description: 'Graphics card or integrated graphics',
              importance: 'high',
              weight: 0.8
            }
          },
          screenSize: {
            type: 'number',
            constraints: { min: 10, max: 20, unit: 'inches' },
            metadata: {
              label: 'Screen Size',
              description: 'Display diagonal size in inches',
              importance: 'high',
              weight: 0.7
            }
          },
          batteryLife: {
            type: 'number',
            constraints: { unit: 'hours' },
            metadata: {
              label: 'Battery Life',
              description: 'Typical battery life in hours',
              importance: 'medium',
              weight: 0.6
            }
          },
          ports: {
            type: 'array',
            metadata: {
              label: 'Available Ports',
              description: 'List of available connection ports',
              importance: 'high',
              weight: 0.8
            }
          },
          operatingSystem: {
            type: 'string',
            metadata: {
              label: 'Operating System',
              description: 'Pre-installed operating system',
              importance: 'medium',
              weight: 0.5
            }
          }
        },
        requiredFields: ['name', 'brand', 'processor', 'memory', 'screenSize']
      },
      tags: ['computer', 'laptop', 'notebook', 'portable'],
      popularity: 90
    });
  }

  /**
   * Get base device fields that are common to all devices
   */
  private getBaseDeviceFields(): Record<string, FieldDefinition> {
    return {
      name: {
        type: 'string',
        constraints: { required: true, minLength: 1, maxLength: 255 },
        metadata: {
          label: 'Device Name',
          description: 'The name of the device',
          importance: 'critical',
          weight: 1.0,
          searchable: true,
          indexable: true
        }
      },
      brand: {
        type: 'string',
        constraints: { required: true, minLength: 1, maxLength: 100 },
        metadata: {
          label: 'Brand',
          description: 'The manufacturer or brand of the device',
          importance: 'high',
          weight: 0.8,
          searchable: true,
          indexable: true
        }
      },
      model: {
        type: 'string',
        constraints: { maxLength: 100 },
        metadata: {
          label: 'Model',
          description: 'The specific model identifier',
          importance: 'medium',
          weight: 0.6,
          searchable: true
        }
      },
      releaseDate: {
        type: 'date',
        metadata: {
          label: 'Release Date',
          description: 'When the device was first released',
          importance: 'low',
          weight: 0.3
        }
      },
      msrp: {
        type: 'number',
        constraints: { min: 0, unit: 'USD' },
        metadata: {
          label: 'MSRP',
          description: 'Manufacturer suggested retail price',
          importance: 'low',
          weight: 0.2
        }
      },
      color: {
        type: 'string',
        metadata: {
          label: 'Color',
          description: 'Primary color or finish',
          importance: 'low',
          weight: 0.1
        }
      }
    };
  }
}

// Export singleton instance
export const templateManager = new CategoryTemplateManager();