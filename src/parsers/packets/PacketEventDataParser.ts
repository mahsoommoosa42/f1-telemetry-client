import {Parser} from 'binary-parser';

import {EVENT_CODES} from '../../constants/eventCodes';
import {F1Parser} from '../F1Parser';

import {PacketHeaderParser} from './PacketHeaderParser';
import {PacketEventData} from './types';

export class GenericEventParser extends F1Parser {
  constructor() {
    super();

    this.endianess('little').uint8('vehicleIdx');
  }
}

export class FastestLapParser extends F1Parser {
  constructor() {
    super();

    this.endianess('little').uint8('vehicleIdx').floatle('lapTime');
  }
}

export class SpeedTrapParser extends F1Parser {
  constructor() {
    super();

    this.endianess('little').uint8('vehicleIdx').floatle('speed');
  }
}

export class PenaltyParser extends F1Parser {
  constructor() {
    super();

    this.endianess('little')
        .uint8('penaltyType')
        .uint8('infringementType')
        .uint8('vehicleIdx')
        .uint8('otherVehicleIdx')
        .uint8('time')
        .uint8('lapNum')
        .uint8('placesGained');
  }
}

export class PacketEventDataParser extends F1Parser {
  data: PacketEventData;

  constructor(buffer: Buffer, packetFormat: number) {
    super();

    this.endianess('little').nest('m_header', {
      type: new PacketHeaderParser(packetFormat),
    });

    this.string('m_eventStringCode', {length: 4});

    this.unpack2020Format(buffer, packetFormat);

    this.data = this.fromBuffer(buffer);
  }

  unpack2020Format = (buffer: Buffer, packetFormat: number) => {
    const eventStringCode = this.getEventStringCode(buffer, packetFormat);

    if (eventStringCode === EVENT_CODES.FastestLap) {
      this.nest('m_eventDetails', {type: new FastestLapParser()});
    } else if (
        eventStringCode === EVENT_CODES.Retirement ||
        eventStringCode === EVENT_CODES.TeammateInPits ||
        eventStringCode === EVENT_CODES.RaceWinner) {
      this.nest('m_eventDetails', {type: new GenericEventParser()});
    } else if (eventStringCode === EVENT_CODES.SpeedTrapTriggered) {
      this.nest('m_eventDetails', {type: new SpeedTrapParser()});
    } else if (eventStringCode === EVENT_CODES.PenaltyIssued) {
      this.nest('m_eventDetails', {type: new PenaltyParser()});
    }
  };

  getEventStringCode = (buffer: Buffer, packetFormat: number) => {
    const headerParser =
        new Parser()
            .endianess('little')
            .nest('m_header', {type: new PacketHeaderParser(packetFormat)})
            .string('m_eventStringCode', {length: 4});
    const {m_eventStringCode} = headerParser.parse(buffer);
    return m_eventStringCode;
  };
}
