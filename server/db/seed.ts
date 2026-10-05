import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
import { logger } from '../utils/logger.js';
import type { CropCategory, Season, SupportedLanguage } from '../../shared/enums.js';

interface SeedCrop {
  category: CropCategory;
  name_en: string;
  names_i18n: Record<SupportedLanguage, string>;
  typical_seasons: Season[];
}

const CROPS_DATA: SeedCrop[] = [
  // 1. Cereals
  {
    category: 'cereals',
    name_en: 'Rice (Paddy)',
    names_i18n: { en: 'Rice (Paddy)', hi: 'धान / चावल', te: 'వరి', ta: 'நெல்', mr: 'भात', kn: 'ಭತ್ತ' },
    typical_seasons: ['kharif', 'rabi'],
  },
  {
    category: 'cereals',
    name_en: 'Wheat',
    names_i18n: { en: 'Wheat', hi: 'गेहूँ', te: 'గోధుమలు', ta: 'கோதுமை', mr: 'गहू', kn: 'ಗೋಧಿ' },
    typical_seasons: ['rabi'],
  },
  {
    category: 'cereals',
    name_en: 'Maize (Corn)',
    names_i18n: { en: 'Maize (Corn)', hi: 'मक्का', te: 'మొక్కజొన్న', ta: 'மக்காச்சோளம்', mr: 'मका', kn: 'ಮೆಕ್ಕೆಜೋಳ' },
    typical_seasons: ['kharif', 'rabi'],
  },
  {
    category: 'cereals',
    name_en: 'Sorghum (Jowar)',
    names_i18n: { en: 'Sorghum (Jowar)', hi: 'ज्वार', te: 'జొన్నలు', ta: 'சோளம்', mr: 'ज्वारी', kn: 'ಜೋಳ' },
    typical_seasons: ['kharif', 'rabi'],
  },
  {
    category: 'cereals',
    name_en: 'Pearl Millet (Bajra)',
    names_i18n: { en: 'Pearl Millet (Bajra)', hi: 'बाजरा', te: 'సజ్జలు', ta: 'கம்பு', mr: 'बाजरी', kn: 'ಸಜ್ಜೆ' },
    typical_seasons: ['kharif'],
  },
  {
    category: 'cereals',
    name_en: 'Finger Millet (Ragi)',
    names_i18n: { en: 'Finger Millet (Ragi)', hi: 'रागी', te: 'రాగులు', ta: 'கேழ்வரகு', mr: 'नाचणी', kn: 'ರಾಗಿ' },
    typical_seasons: ['kharif'],
  },
  {
    category: 'cereals',
    name_en: 'Barley',
    names_i18n: { en: 'Barley', hi: 'जौ', te: 'బార్లీ', ta: 'பார்லி', mr: 'सातू', kn: 'ಬಾರ್ಲಿ' },
    typical_seasons: ['rabi'],
  },

  // 2. Pulses
  {
    category: 'pulses',
    name_en: 'Chickpea (Bengal Gram)',
    names_i18n: { en: 'Chickpea (Bengal Gram)', hi: 'चना', te: 'శనగలు', ta: 'கொண்டைக்கடலை', mr: 'हरभरा', kn: 'ಕಡಲೆ' },
    typical_seasons: ['rabi'],
  },
  {
    category: 'pulses',
    name_en: 'Pigeon Pea (Red Gram / Arhar / Tur)',
    names_i18n: { en: 'Pigeon Pea (Tur)', hi: 'अरहर / तूर', te: 'కందులు', ta: 'துவரை', mr: 'तूर', kn: 'ತೊಗರಿ' },
    typical_seasons: ['kharif'],
  },
  {
    category: 'pulses',
    name_en: 'Green Gram (Moong)',
    names_i18n: { en: 'Green Gram (Moong)', hi: 'मूंग', te: 'పెసలు', ta: 'பாசிப்பயறு', mr: 'मूग', kn: 'ಹೆಸರುಕಾಳು' },
    typical_seasons: ['kharif', 'zaid'],
  },
  {
    category: 'pulses',
    name_en: 'Black Gram (Urad)',
    names_i18n: { en: 'Black Gram (Urad)', hi: 'उड़द', te: 'మినుములు', ta: 'உளுந்து', mr: 'उडीद', kn: 'ಉದ್ದು' },
    typical_seasons: ['kharif', 'rabi'],
  },
  {
    category: 'pulses',
    name_en: 'Lentil (Masoor)',
    names_i18n: { en: 'Lentil (Masoor)', hi: 'मसूर', te: 'ఎర్ర కంది', ta: 'மசூர் பருப்பு', mr: 'मसूर', kn: 'ಮಸೂರ್' },
    typical_seasons: ['rabi'],
  },
  {
    category: 'pulses',
    name_en: 'Cowpea (Lobia)',
    names_i18n: { en: 'Cowpea (Lobia)', hi: 'लोबिया', te: 'అలసందలు', ta: 'தட்டப்பயறு', mr: 'चवळी', kn: 'ಅಲಸಂದೆ' },
    typical_seasons: ['kharif', 'zaid'],
  },
  {
    category: 'pulses',
    name_en: 'Field Pea (Matar)',
    names_i18n: { en: 'Field Pea (Matar)', hi: 'मटर', te: 'బఠానీలు', ta: 'பட்டாணி', mr: 'वाटाणा', kn: 'ಬಟಾಣಿ' },
    typical_seasons: ['rabi'],
  },

  // 3. Oilseeds
  {
    category: 'oilseeds',
    name_en: 'Groundnut (Peanut)',
    names_i18n: { en: 'Groundnut', hi: 'मूंगफली', te: 'వేరుశనగ', ta: 'வேர்க்கடலை', mr: 'भुईमूग', kn: 'ಕಡಲೆಕಾಯಿ' },
    typical_seasons: ['kharif', 'rabi'],
  },
  {
    category: 'oilseeds',
    name_en: 'Soybean',
    names_i18n: { en: 'Soybean', hi: 'सोयाबीन', te: 'సోయాబీన్', ta: 'சோயாபீன்', mr: 'सोयाबीन', kn: 'ಸೋಯಾಬೀನ್' },
    typical_seasons: ['kharif'],
  },
  {
    category: 'oilseeds',
    name_en: 'Sunflower',
    names_i18n: { en: 'Sunflower', hi: 'सूरजमुखी', te: 'పొద్దుతిరుగుడు', ta: 'சூரியகாந்தி', mr: 'सूर्यफूल', kn: 'ಸೂರ್ಯಕಾಂತಿ' },
    typical_seasons: ['kharif', 'rabi'],
  },
  {
    category: 'oilseeds',
    name_en: 'Mustard (Rapeseed)',
    names_i18n: { en: 'Mustard', hi: 'सरसों', te: 'ఆవాలు', ta: 'கடுகு', mr: 'मोहरी', kn: 'ಸಾಸಿವೆ' },
    typical_seasons: ['rabi'],
  },
  {
    category: 'oilseeds',
    name_en: 'Sesame (Til)',
    names_i18n: { en: 'Sesame (Til)', hi: 'तिल', te: 'నువ్వులు', ta: 'எள்', mr: 'तीळ', kn: 'ಎಳ್ಳು' },
    typical_seasons: ['kharif', 'zaid'],
  },
  {
    category: 'oilseeds',
    name_en: 'Castor',
    names_i18n: { en: 'Castor', hi: 'अरंडी', te: 'ఆముదము', ta: 'ஆமணக்கு', mr: 'एरंडी', kn: 'ಹರಳು' },
    typical_seasons: ['kharif'],
  },
  {
    category: 'oilseeds',
    name_en: 'Safflower (Kusum)',
    names_i18n: { en: 'Safflower (Kusum)', hi: 'कुसुम', te: 'కుసుమలు', ta: 'குங்குமப்பூ பயிர்', mr: 'करडई', kn: 'ಕುಸುಬೆ' },
    typical_seasons: ['rabi'],
  },

  // 4. Vegetables
  {
    category: 'vegetables',
    name_en: 'Tomato',
    names_i18n: { en: 'Tomato', hi: 'टमाटर', te: 'టమాటా', ta: 'தக்காளி', mr: 'टोमॅटो', kn: 'ಟೊಮೆಟೊ' },
    typical_seasons: ['kharif', 'rabi', 'zaid'],
  },
  {
    category: 'vegetables',
    name_en: 'Chilli (Hot Pepper)',
    names_i18n: { en: 'Chilli', hi: 'मिर्च', te: 'మిరపకాయ', ta: 'மிளகாய்', mr: 'मिरची', kn: 'ಮೆಣಸಿನಕಾಯಿ' },
    typical_seasons: ['kharif', 'rabi'],
  },
  {
    category: 'vegetables',
    name_en: 'Brinjal (Eggplant)',
    names_i18n: { en: 'Brinjal (Eggplant)', hi: 'बैंगन', te: 'వంకాయ', ta: 'கத்தரிக்காய்', mr: 'वांगे', kn: 'ಬದನೆಕಾಯಿ' },
    typical_seasons: ['kharif', 'rabi', 'zaid'],
  },
  {
    category: 'vegetables',
    name_en: 'Okra (Ladyfinger / Bhindi)',
    names_i18n: { en: 'Okra (Ladyfinger)', hi: 'भिंडी', te: 'బెండకాయ', ta: 'வெண்டைக்காய்', mr: 'भेंडी', kn: 'ಬೆಂಡೆಕಾಯಿ' },
    typical_seasons: ['kharif', 'zaid'],
  },
  {
    category: 'vegetables',
    name_en: 'Onion',
    names_i18n: { en: 'Onion', hi: 'प्याज', te: 'ఉల్లిపాయ', ta: 'வெங்காயம்', mr: 'कांदा', kn: 'ಈರುಳ್ಳಿ' },
    typical_seasons: ['kharif', 'rabi'],
  },
  {
    category: 'vegetables',
    name_en: 'Potato',
    names_i18n: { en: 'Potato', hi: 'आलू', te: 'బంగాళాదుంప', ta: 'உருளைக்கிழங்கு', mr: 'बटाटा', kn: 'ಆಲೂಗಡ್ಡೆ' },
    typical_seasons: ['rabi'],
  },
  {
    category: 'vegetables',
    name_en: 'Cabbage',
    names_i18n: { en: 'Cabbage', hi: 'पत्तागोभी', te: 'క్యాబేజీ', ta: 'முட்டைக்கோஸ்', mr: 'कोबी', kn: 'ಎಲೆಕೋಸು' },
    typical_seasons: ['rabi'],
  },
  {
    category: 'vegetables',
    name_en: 'Cauliflower',
    names_i18n: { en: 'Cauliflower', hi: 'फूलगोभी', te: 'క్యాలీఫ్లవర్', ta: 'காலிஃபிளவர்', mr: 'फ्लॉवर', kn: 'ಹೂಕೋಸು' },
    typical_seasons: ['rabi'],
  },
  {
    category: 'vegetables',
    name_en: 'Bottle Gourd (Lauki)',
    names_i18n: { en: 'Bottle Gourd (Lauki)', hi: 'लौकी', te: 'ఆనపకాయ', ta: 'சுரைக்காய்', mr: 'दुधी भोपळा', kn: 'ಸೋರೆಕಾಯಿ' },
    typical_seasons: ['kharif', 'zaid'],
  },
  {
    category: 'vegetables',
    name_en: 'Bitter Gourd (Karela)',
    names_i18n: { en: 'Bitter Gourd (Karela)', hi: 'करेला', te: 'కాకరకాయ', ta: 'பாகற்காய்', mr: 'कारले', kn: 'ಹಾಗಲಕಾಯಿ' },
    typical_seasons: ['kharif', 'zaid'],
  },

  // 5. Fruits
  {
    category: 'fruits',
    name_en: 'Mango',
    names_i18n: { en: 'Mango', hi: 'आम', te: 'మామిడి', ta: 'மாம்பழம்', mr: 'आंबा', kn: 'ಮಾವು' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'fruits',
    name_en: 'Banana',
    names_i18n: { en: 'Banana', hi: 'केला', te: 'అరటి', ta: 'வாழை', mr: 'केळी', kn: 'ಬಾಳೆ' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'fruits',
    name_en: 'Citrus (Lemon / Lime / Orange)',
    names_i18n: { en: 'Citrus (Lemon / Orange)', hi: 'नींबू / संतरा', te: 'నిమ్మ / బత్తాయి', ta: 'எலுமிச்சை', mr: 'लिंबू / संत्री', kn: 'ನಿಂಬೆ' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'fruits',
    name_en: 'Pomegranate',
    names_i18n: { en: 'Pomegranate', hi: 'अनार', te: 'దానిమ్మ', ta: 'மாதுளை', mr: 'डाळिंब', kn: 'ದಾಳಿಂಬೆ' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'fruits',
    name_en: 'Guava',
    names_i18n: { en: 'Guava', hi: 'अमरूद', te: 'జామకాయ', ta: 'கொய்யா', mr: 'पेरू', kn: 'ಸೀಬೆಕಾಯಿ' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'fruits',
    name_en: 'Papaya',
    names_i18n: { en: 'Papaya', hi: 'पपीता', te: 'బొప్పాయి', ta: 'பப்பாளி', mr: 'पपई', kn: 'ಪರಂಗಿ' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'fruits',
    name_en: 'Grapes',
    names_i18n: { en: 'Grapes', hi: 'अंगूर', te: 'ద్రాక్ష', ta: 'திராட்சை', mr: 'द्राक्षे', kn: 'ದ್ರಾಕ್ಷಿ' },
    typical_seasons: ['perennial', 'rabi'],
  },
  {
    category: 'fruits',
    name_en: 'Watermelon',
    names_i18n: { en: 'Watermelon', hi: 'तरबूज', te: 'పుచ్చకాయ', ta: 'தர்பூசணி', mr: 'कलिंगड', kn: 'ಕಲ್ಲಂಗಡಿ' },
    typical_seasons: ['zaid'],
  },

  // 6. Cash Crops
  {
    category: 'cash_crops',
    name_en: 'Cotton',
    names_i18n: { en: 'Cotton', hi: 'कपास', te: 'పత్తి', ta: 'பருத்தி', mr: 'कापूस', kn: 'ಹತ್ತಿ' },
    typical_seasons: ['kharif'],
  },
  {
    category: 'cash_crops',
    name_en: 'Sugarcane',
    names_i18n: { en: 'Sugarcane', hi: 'गन्ना', te: 'చెరకు', ta: 'கரும்பு', mr: 'ऊस', kn: 'ಕಬ್ಬು' },
    typical_seasons: ['perennial', 'kharif'],
  },
  {
    category: 'cash_crops',
    name_en: 'Tobacco',
    names_i18n: { en: 'Tobacco', hi: 'तंबाकू', te: 'పొగాకు', ta: 'புகையிலை', mr: 'तंबाखू', kn: 'ತಂಬಾಕು' },
    typical_seasons: ['rabi'],
  },
  {
    category: 'cash_crops',
    name_en: 'Jute',
    names_i18n: { en: 'Jute', hi: 'पटसन / जूट', te: 'జనపనార', ta: 'சணல்', mr: 'ताग', kn: 'ಸೆಣಬು' },
    typical_seasons: ['kharif'],
  },

  // 7. Plantation & Spices
  {
    category: 'plantation_spices',
    name_en: 'Turmeric',
    names_i18n: { en: 'Turmeric', hi: 'हल्दी', te: 'పసుపు', ta: 'மஞ்சள்', mr: 'हळद', kn: 'ಅರಿಶಿನ' },
    typical_seasons: ['kharif'],
  },
  {
    category: 'plantation_spices',
    name_en: 'Ginger',
    names_i18n: { en: 'Ginger', hi: 'अदरक', te: 'అల్లం', ta: 'இஞ்சி', mr: 'आले', kn: 'ಶುಂಟಿ' },
    typical_seasons: ['kharif'],
  },
  {
    category: 'plantation_spices',
    name_en: 'Black Pepper',
    names_i18n: { en: 'Black Pepper', hi: 'काली मिर्च', te: 'మిరియాలు', ta: 'மிளகு', mr: 'काळी मिरी', kn: 'ಕಾಳುಮೆಣಸು' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'plantation_spices',
    name_en: 'Cardamom',
    names_i18n: { en: 'Cardamom', hi: 'इलायची', te: 'యాలకులు', ta: 'ஏலக்காய்', mr: 'वेलची', kn: 'ಏಲಕ್ಕಿ' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'plantation_spices',
    name_en: 'Coconut',
    names_i18n: { en: 'Coconut', hi: 'नारियल', te: 'కొబ్బరి', ta: 'தேங்காய்', mr: 'नारळ', kn: 'ತೆಂಗಿನಕಾಯಿ' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'plantation_spices',
    name_en: 'Coffee',
    names_i18n: { en: 'Coffee', hi: 'कॉफ़ी', te: 'కాఫీ', ta: 'காபி', mr: 'कॉफी', kn: 'ಕಾಫಿ' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'plantation_spices',
    name_en: 'Tea',
    names_i18n: { en: 'Tea', hi: 'चाय', te: 'తేయాకు', ta: 'தேயிலை', mr: 'चहा', kn: 'ಚಹಾ' },
    typical_seasons: ['perennial'],
  },

  // 8. Floriculture
  {
    category: 'floriculture',
    name_en: 'Marigold',
    names_i18n: { en: 'Marigold', hi: 'गेंदा', te: 'బంతిపూలు', ta: 'சாமந்தி', mr: 'झेंडू', kn: 'ಚೆಂಡುಹೂ' },
    typical_seasons: ['kharif', 'rabi', 'zaid'],
  },
  {
    category: 'floriculture',
    name_en: 'Rose',
    names_i18n: { en: 'Rose', hi: 'गुलाब', te: 'గులాబీ', ta: 'ரோஜா', mr: 'गुलाब', kn: 'ಗುಲಾಬಿ' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'floriculture',
    name_en: 'Jasmine (Mogra)',
    names_i18n: { en: 'Jasmine (Mogra)', hi: 'मोगरा / चमेली', te: 'మల్లెపూలు', ta: 'மல்லிகை', mr: 'मोगरा', kn: 'ಮಲ್ಲಿಗೆ' },
    typical_seasons: ['perennial'],
  },
  {
    category: 'floriculture',
    name_en: 'Chrysanthemum (Shevanti)',
    names_i18n: { en: 'Chrysanthemum', hi: 'गुलदाउदी', te: 'చామంతి', ta: 'செவ்வந்தி', mr: 'शेवंती', kn: 'ಸೇವಂತಿ' },
    typical_seasons: ['rabi'],
  },
  {
    category: 'floriculture',
    name_en: 'Tuberose (Rajnigandha)',
    names_i18n: { en: 'Tuberose (Rajnigandha)', hi: 'रजनीगंधा', te: 'నిషిగంధ', ta: 'சம்பங்கி', mr: 'निशिगंध', kn: 'ಸುಗಂಧರಾಜ' },
    typical_seasons: ['kharif', 'rabi'],
  },
];

export async function seedDatabase(): Promise<void> {
  logger.info('Starting database seeding...');

  // 1. Seed Crops
  let insertedCount = 0;
  for (const crop of CROPS_DATA) {
    await pool.query(
      `INSERT INTO crops (category, name_en, names_i18n, typical_seasons, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (name_en) DO UPDATE
       SET category = EXCLUDED.category,
           names_i18n = EXCLUDED.names_i18n,
           typical_seasons = EXCLUDED.typical_seasons,
           is_active = true`,
      [crop.category, crop.name_en, JSON.stringify(crop.names_i18n), crop.typical_seasons]
    );
    insertedCount++;
  }
  logger.info({ count: insertedCount }, 'Crops seeded successfully');

  // 2. Seed Demo User in non-production
  if (process.env.NODE_ENV !== 'production') {
    const demoEmail = 'demo@kisanmitra.test';
    const demoPasswordHash = await bcrypt.hash('Farmer@123', 12);

    const userRes = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, preferred_language, simple_mode, daily_ai_quota)
       VALUES ($1, $2, $3, 'en', false, 50)
       ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [demoEmail, demoPasswordHash, 'Ramesh Kumar (Demo Farmer)']
    );

    const demoUserId = userRes.rows[0].id;
    logger.info({ demoEmail, demoUserId }, 'Demo user created/updated (Password: Farmer@123)');

    // Check if demo user has farms, if not, create one
    const farmCheck = await pool.query('SELECT id FROM farms WHERE user_id = $1 LIMIT 1', [demoUserId]);
    if (farmCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO farms (user_id, name, state, district, village, total_area_acres, soil_type, irrigation_source, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          demoUserId,
          'Shanti Farm',
          'Maharashtra',
          'Nashik',
          'Dindori',
          4.5,
          'black',
          'drip',
          20.0059,
          73.7898,
        ]
      );
      logger.info('Demo farm created for demo user');
    }
  }

  logger.info('Database seeding completed successfully.');
}

if (process.argv[1] === (await import('url')).fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => {
      logger.info('Database seed process finished cleanly.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database seed error:', err);
      process.exit(1);
    });
}
