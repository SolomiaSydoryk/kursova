// Кольорова палітра проєкту (Sports Center Theme)
// На основі палітри: EMERALD GREEN, WASABI, CREASED KHAKI, EGYPTIAN EARTH, NOIR DE VIGNE
export const colors = {

  emeraldGreen: '#1F5A4D',      // Насичений темно-зелений (primary main) - оригіна 
  wasabi: '#6B8A6B',            // Насичений світло-зелений (primary light, secondary) 
  creasedKhaki: '#F5E6D3',      // М'якший бежевий/кремовий, менш жовтий (accent light, background) - RGB: 245, 230, 211
  egyptianEarth: '#BB6830',     // Насичений помаранчево-коричневий (accent main) - RGB: 187, 104, 48
  noirDeVigne: '#111A19',       // Дуже темний зелено-коричневий (primary dark, text) - RGB: 17, 20, 25
  
  lightEmerald: '#2D6B5A',      // Світліший відтінок emeraldGreen
  darkEmerald: '#153D33',       // Темніший відтінок emeraldGreen
  lightWasabi: '#8FA88F',       // Світліший відтінок wasabi
  veryLightWasabi: '#D4E4D4',  // Дуже світлий відтінок wasabi (для bonus сповіщень) - зроблено світлішим
  darkWasabi: '#4F6B4F',        // Темніший відтінок wasabi
  lightKhaki: '#FAF0E6',        // Світліший відтінок creasedKhaki (м'якший)
  darkKhaki: '#E8D4B8',         // Темніший відтінок creasedKhaki (менш жовтий)
  lightEarth: '#D48A4A',        // Світліший відтінок egyptianEarth
  darkEarth: '#9A5420',         // Темніший відтінок egyptianEarth
  veryLightKhaki: '#FDF8F3',    // Дуже світлий відтінок khaki (background, м'якший і менш жовтий)
  
  // Службові кольори
  success: '#1F5A4D',           // Використовуємо emeraldGreen для success
  error: '#C62828',             // Червоний для помилок
  warning: '#BB6830',            // Використовуємо egyptianEarth для warning
};

export const palette = {
  primary: {
    main: colors.emeraldGreen,   // Насичений темно-зелений (основний колір)
    light: colors.wasabi,         // Насичений світло-зелений (світліший відтінок)
    dark: colors.noirDeVigne,     // Дуже темний зелено-коричневий (темніший відтінок)
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: colors.wasabi,          // Насичений світло-зелений
    light: colors.lightWasabi,    // Світліший wasabi
    dark: colors.darkWasabi,      // Темніший wasabi
    contrastText: '#FFFFFF',
  },
  accent: {
    main: colors.egyptianEarth,    // Насичений помаранчево-коричневий (акцент)
    light: colors.creasedKhaki,   // Світлий теплий бежевий
    dark: colors.darkEarth,        // Темніший egyptianEarth
    contrastText: '#FFFFFF',
  },
  background: {
    default: colors.veryLightKhaki, // Дуже світлий бежевий фон
    paper: '#FFFFFF',
  },
  text: {
    primary: colors.noirDeVigne,  // Дуже темний зелено-коричневий для основного тексту
    secondary: colors.emeraldGreen, // Темно-зелений для другорядного тексту
  },
  divider: colors.lightWasabi,    // Світліший wasabi для роздільників
  success: {
    main: colors.success,
    light: colors.wasabi,
    dark: colors.darkEmerald,
    contrastText: '#FFFFFF',
  },
  error: {
    main: colors.error,
    light: '#EF5350',
    dark: '#B71C1C',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: colors.warning,
    light: colors.creasedKhaki,
    dark: colors.darkEarth,
    contrastText: '#FFFFFF',
  },
};
