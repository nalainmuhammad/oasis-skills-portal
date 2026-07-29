export type AvatarIconId = 
  | 'default' | 'cat' | 'fox' | 'robot' | 'ninja' 
  | 'dragon' | 'owl' | 'lion' | 'bear' | 'monkey'
  | 'penguin' | 'tiger';

export const AVATAR_ICONS: { id: AvatarIconId; name: string; svg: React.ReactNode }[] = [
  {
    id: 'default',
    name: 'Classic',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    )
  },
  {
    id: 'cat',
    name: 'Whiskers',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20,70 L20,30 L40,45 L60,45 L80,30 L80,70 Q80,90 50,90 Q20,90 20,70 Z" fill="currentColor" fillOpacity="0.2"/>
        <circle cx="35" cy="60" r="5" fill="currentColor"/>
        <circle cx="65" cy="60" r="5" fill="currentColor"/>
        <path d="M45,70 L50,75 L55,70" />
      </svg>
    )
  },
  {
    id: 'fox',
    name: 'Sly',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10,20 L35,40 L65,40 L90,20 L80,80 L50,95 L20,80 Z" fill="currentColor" fillOpacity="0.2"/>
        <path d="M25,55 L40,65 L50,80 L60,65 L75,55" />
        <circle cx="35" cy="50" r="4" fill="currentColor"/>
        <circle cx="65" cy="50" r="4" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'robot',
    name: 'Spark',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="25" y="30" width="50" height="45" rx="5" fill="currentColor" fillOpacity="0.2"/>
        <path d="M40,15 L50,30 L60,15 M35,50 L45,50 M65,50 L55,50" />
        <rect x="35" y="60" width="30" height="5" />
        <circle cx="50" cy="15" r="3" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'ninja',
    name: 'Shadow',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="50" r="40" fill="currentColor" fillOpacity="0.2"/>
        <path d="M20,40 C30,35 70,35 80,40 L80,60 C70,65 30,65 20,60 Z" fill="currentColor" fillOpacity="0.5"/>
        <circle cx="40" cy="50" r="4" fill="currentColor"/>
        <circle cx="60" cy="50" r="4" fill="currentColor"/>
        <path d="M15,45 L5,35 M85,45 L95,35" />
      </svg>
    )
  },
  {
    id: 'dragon',
    name: 'Ember',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50,90 Q20,60 30,20 Q40,30 50,40 Q60,30 70,20 Q80,60 50,90 Z" fill="currentColor" fillOpacity="0.2"/>
        <path d="M40,55 Q50,65 60,55 M45,70 Q50,75 55,70" />
        <circle cx="40" cy="45" r="3" fill="currentColor"/>
        <circle cx="60" cy="45" r="3" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'owl',
    name: 'Hoots',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M25,50 Q25,20 50,20 Q75,20 75,50 L75,80 Q50,90 25,80 Z" fill="currentColor" fillOpacity="0.2"/>
        <circle cx="40" cy="45" r="12" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="60" cy="45" r="12" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="40" cy="45" r="4" fill="currentColor"/>
        <circle cx="60" cy="45" r="4" fill="currentColor"/>
        <path d="M47,60 L50,65 L53,60 Z" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'lion',
    name: 'Leo',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15,50 C15,20 85,20 85,50 C85,85 15,85 15,50 Z" fill="currentColor" fillOpacity="0.1" strokeDasharray="5,5"/>
        <circle cx="50" cy="55" r="25" fill="currentColor" fillOpacity="0.3"/>
        <circle cx="42" cy="50" r="3" fill="currentColor"/>
        <circle cx="58" cy="50" r="3" fill="currentColor"/>
        <path d="M48,60 L50,62 L52,60" />
        <path d="M35,65 Q50,75 65,65" />
      </svg>
    )
  },
  {
    id: 'bear',
    name: 'Baloo',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="30" cy="30" r="12" fill="currentColor" fillOpacity="0.2"/>
        <circle cx="70" cy="30" r="12" fill="currentColor" fillOpacity="0.2"/>
        <circle cx="50" cy="60" r="35" fill="currentColor" fillOpacity="0.2"/>
        <circle cx="50" cy="65" r="15" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="40" cy="50" r="4" fill="currentColor"/>
        <circle cx="60" cy="50" r="4" fill="currentColor"/>
        <path d="M47,62 C47,62 50,65 53,62" />
        <circle cx="50" cy="60" r="2" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'monkey',
    name: 'Pip',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15,50 Q5,30 25,30 Q30,10 50,15 Q70,10 75,30 Q95,30 85,50 Q90,80 50,90 Q10,80 15,50 Z" fill="currentColor" fillOpacity="0.2"/>
        <circle cx="35" cy="45" r="4" fill="currentColor"/>
        <circle cx="65" cy="45" r="4" fill="currentColor"/>
        <path d="M40,65 Q50,75 60,65" />
      </svg>
    )
  },
  {
    id: 'penguin',
    name: 'Waddle',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30,85 C20,50 35,15 50,15 C65,15 80,50 70,85 C60,95 40,95 30,85 Z" fill="currentColor" fillOpacity="0.2"/>
        <path d="M40,85 C35,55 45,30 50,30 C55,30 65,55 60,85 C55,90 45,90 40,85 Z" fill="#ffffff" fillOpacity="0.3"/>
        <circle cx="43" cy="40" r="3" fill="currentColor"/>
        <circle cx="57" cy="40" r="3" fill="currentColor"/>
        <path d="M47,50 L50,55 L53,50 Z" fill="currentColor"/>
      </svg>
    )
  },
  {
    id: 'tiger',
    name: 'Stripe',
    svg: (
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="55" r="35" fill="currentColor" fillOpacity="0.2"/>
        <path d="M25,25 Q35,15 45,25 M75,25 Q65,15 55,25" fill="currentColor" fillOpacity="0.2"/>
        <circle cx="38" cy="45" r="4" fill="currentColor"/>
        <circle cx="62" cy="45" r="4" fill="currentColor"/>
        <path d="M50,20 L50,35 M30,45 L40,50 M70,45 L60,50 M25,60 L35,60 M75,60 L65,60" />
        <path d="M48,60 L50,62 L52,60" />
      </svg>
    )
  }
];

export function getAvatarIcon(id: string) {
  return AVATAR_ICONS.find(icon => icon.id === id) || AVATAR_ICONS[0];
}
