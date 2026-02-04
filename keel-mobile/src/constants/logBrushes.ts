// keel-mobile/src/constants/logBrushes.ts

export interface DeptUITheme {
  primary: string;
  secondary: string;
  watchLabel: string;
  techLabel: string;
  watchColor: string;
  label1: string;
  label2: string;
  placeholder1: string;
  placeholder2: string;
  unit1: string;
  unit2: string;
}

export const getDepartmentConfig = (dept: string | null | undefined, rank: string | null | undefined = ''): DeptUITheme => {
  // FALLBACK LOGIC: If dept is null, check if 'Engine' or 'ETO' is in the Rank string
  const rawRank = (rank || '').toUpperCase();
  let d = (dept || '').toUpperCase();

  if (!d) {
    if (rawRank.includes('ENGINE') || rawRank.includes('BTECH')) d = 'ENGINE';
    else if (rawRank.includes('ETO') || rawRank.includes('ELECTRICAL')) d = 'ETO';
    else if (rawRank.includes('CATERING') || rawRank.includes('COOK')) d = 'CATERING';
    else d = 'DECK';
  }

  const themes: Record<string, DeptUITheme> = {
    ENGINE: {
      primary: '#8B5CF6', 
      secondary: '#C4B5FD',
      watchLabel: 'E/R WATCH',
      techLabel: 'MAINTENANCE',
      watchColor: '#8B5CF6',
      label1: 'MAIN ENGINE RPM',
      label2: 'AVG EXH TEMP',
      placeholder1: '85',
      placeholder2: '340',
      unit1: 'RPM',
      unit2: '°C'
    },
    ETO: {
      primary: '#06B6D4',
      secondary: '#A5F3FC',
      watchLabel: 'E/R WATCH',
      techLabel: 'ELECTRICAL',
      watchColor: '#06B6D4',
      label1: 'BUS BAR LOAD',
      label2: 'INSULATION RES.',
      placeholder1: '450',
      placeholder2: '>100',
      unit1: 'kW',
      unit2: 'MΩ'
    },
    CATERING: {
      primary: '#EC4899',
      secondary: '#FBCFE8',
      watchLabel: 'SERVICE',
      techLabel: 'VICTUALLING',
      watchColor: '#EC4899',
      label1: 'MEALS PREPARED',
      label2: 'GALLEY TEMP',
      placeholder1: '120',
      placeholder2: '24',
      unit1: 'QTY',
      unit2: '°C'
    },
    DECK: {
      primary: '#3194A0',
      secondary: '#99D1D8',
      watchLabel: 'BRIDGE WATCH',
      techLabel: 'STEERING',
      watchColor: '#3B82F6',
      label1: 'NOON LATITUDE',
      label2: 'NOON LONGITUDE',
      placeholder1: "00° 00.0' N",
      placeholder2: "000° 00.0' E",
      unit1: 'COORD',
      unit2: 'COORD'
    }
  };

  return themes[d] || themes.DECK;
};