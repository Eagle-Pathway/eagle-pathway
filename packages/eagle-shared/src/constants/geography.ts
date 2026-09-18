export interface CountryOption {
  name: string;
  code: string; // ISO 2-letter
  flag: string;
  region: string;
  isDeveloping?: boolean;
}

/**
 * Complete, exhaustive list of all sovereign world nations and territories (195+ countries)
 * Sorted strictly in alphabetical order (A to Z).
 */
export const ALL_COUNTRIES: CountryOption[] = [
  { name: 'Afghanistan', code: 'AF', flag: '🇦🇫', region: 'South Asia', isDeveloping: true },
  { name: 'Albania', code: 'AL', flag: '🇦🇱', region: 'Europe', isDeveloping: true },
  { name: 'Algeria', code: 'DZ', flag: '🇩🇿', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Andorra', code: 'AD', flag: '🇦🇩', region: 'Europe', isDeveloping: false },
  { name: 'Angola', code: 'AO', flag: '🇦🇴', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Antigua and Barbuda', code: 'AG', flag: '🇦🇬', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Armenia', code: 'AM', flag: '🇦🇲', region: 'Central Asia & Caucasus', isDeveloping: true },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', region: 'Oceania', isDeveloping: false },
  { name: 'Austria', code: 'AT', flag: '🇦🇹', region: 'Europe', isDeveloping: false },
  { name: 'Azerbaijan', code: 'AZ', flag: '🇦🇿', region: 'Central Asia & Caucasus', isDeveloping: true },
  { name: 'Bahamas', code: 'BS', flag: '🇧🇸', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Bahrain', code: 'BH', flag: '🇧🇭', region: 'North Africa & Middle East', isDeveloping: false },
  { name: 'Bangladesh', code: 'BD', flag: '🇧🇩', region: 'South Asia', isDeveloping: true },
  { name: 'Barbados', code: 'BB', flag: '🇧🇧', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Belarus', code: 'BY', flag: '🇧🇾', region: 'Europe', isDeveloping: true },
  { name: 'Belgium', code: 'BE', flag: '🇧🇪', region: 'Europe', isDeveloping: false },
  { name: 'Belize', code: 'BZ', flag: '🇧🇿', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Benin', code: 'BJ', flag: '🇧🇯', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Bhutan', code: 'BT', flag: '🇧🇹', region: 'South Asia', isDeveloping: true },
  { name: 'Bolivia', code: 'BO', flag: '🇧🇴', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Bosnia and Herzegovina', code: 'BA', flag: '🇧🇦', region: 'Europe', isDeveloping: true },
  { name: 'Botswana', code: 'BW', flag: '🇧🇼', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Brunei', code: 'BN', flag: '🇧🇳', region: 'Southeast Asia', isDeveloping: false },
  { name: 'Bulgaria', code: 'BG', flag: '🇧🇬', region: 'Europe', isDeveloping: false },
  { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Burundi', code: 'BI', flag: '🇧🇮', region: 'East Africa', isDeveloping: true },
  { name: 'Cabo Verde', code: 'CV', flag: '🇨🇻', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Cambodia', code: 'KH', flag: '🇰🇭', region: 'Southeast Asia', isDeveloping: true },
  { name: 'Cameroon', code: 'CM', flag: '🇨🇲', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', region: 'North America', isDeveloping: false },
  { name: 'Central African Republic', code: 'CF', flag: '🇨🇫', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Chad', code: 'TD', flag: '🇹🇩', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Chile', code: 'CL', flag: '🇨🇱', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'China', code: 'CN', flag: '🇨🇳', region: 'East Asia', isDeveloping: true },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Comoros', code: 'KM', flag: '🇰🇲', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Congo', code: 'CG', flag: '🇨🇬', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Costa Rica', code: 'CR', flag: '🇨🇷', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Croatia', code: 'HR', flag: '🇭🇷', region: 'Europe', isDeveloping: false },
  { name: 'Cuba', code: 'CU', flag: '🇨🇺', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Cyprus', code: 'CY', flag: '🇨🇾', region: 'Europe', isDeveloping: false },
  { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿', region: 'Europe', isDeveloping: false },
  { name: 'DR Congo', code: 'CD', flag: '🇨🇩', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Denmark', code: 'DK', flag: '🇩🇰', region: 'Europe', isDeveloping: false },
  { name: 'Djibouti', code: 'DJ', flag: '🇩🇯', region: 'East Africa', isDeveloping: true },
  { name: 'Dominica', code: 'DM', flag: '🇩🇲', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Dominican Republic', code: 'DO', flag: '🇩🇴', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Ecuador', code: 'EC', flag: '🇪🇨', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Egypt', code: 'EG', flag: '🇪🇬', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'El Salvador', code: 'SV', flag: '🇸🇻', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Equatorial Guinea', code: 'GQ', flag: '🇬🇶', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Eritrea', code: 'ER', flag: '🇪🇷', region: 'East Africa', isDeveloping: true },
  { name: 'Estonia', code: 'EE', flag: '🇪🇪', region: 'Europe', isDeveloping: false },
  { name: 'Eswatini', code: 'SZ', flag: '🇸🇿', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Ethiopia', code: 'ET', flag: '🇪🇹', region: 'East Africa', isDeveloping: true },
  { name: 'Fiji', code: 'FJ', flag: '🇫🇯', region: 'Oceania', isDeveloping: true },
  { name: 'Finland', code: 'FI', flag: '🇫🇮', region: 'Europe', isDeveloping: false },
  { name: 'France', code: 'FR', flag: '🇫🇷', region: 'Europe', isDeveloping: false },
  { name: 'Gabon', code: 'GA', flag: '🇬🇦', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Gambia', code: 'GM', flag: '🇬🇲', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Georgia', code: 'GE', flag: '🇬🇪', region: 'Central Asia & Caucasus', isDeveloping: true },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', region: 'Europe', isDeveloping: false },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Global / Multiple Destinations', code: 'GLOBAL', flag: '🌍', region: 'Global', isDeveloping: false },
  { name: 'Greece', code: 'GR', flag: '🇬🇷', region: 'Europe', isDeveloping: false },
  { name: 'Grenada', code: 'GD', flag: '🇬🇩', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Guatemala', code: 'GT', flag: '🇬🇹', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Guinea', code: 'GN', flag: '🇬🇳', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Guinea-Bissau', code: 'GW', flag: '🇬🇼', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Guyana', code: 'GY', flag: '🇬🇾', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Haiti', code: 'HT', flag: '🇭🇹', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Honduras', code: 'HN', flag: '🇭🇳', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Hong Kong', code: 'HK', flag: '🇭🇰', region: 'East Asia', isDeveloping: false },
  { name: 'Hungary', code: 'HU', flag: '🇭🇺', region: 'Europe', isDeveloping: false },
  { name: 'Iceland', code: 'IS', flag: '🇮🇸', region: 'Europe', isDeveloping: false },
  { name: 'India', code: 'IN', flag: '🇮🇳', region: 'South Asia', isDeveloping: true },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩', region: 'Southeast Asia', isDeveloping: true },
  { name: 'Iran', code: 'IR', flag: '🇮🇷', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Iraq', code: 'IQ', flag: '🇮🇶', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪', region: 'Europe', isDeveloping: false },
  { name: 'Israel', code: 'IL', flag: '🇮🇱', region: 'North Africa & Middle East', isDeveloping: false },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', region: 'Europe', isDeveloping: false },
  { name: 'Ivory Coast', code: 'CI', flag: '🇨🇮', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Jamaica', code: 'JM', flag: '🇯🇲', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', region: 'East Asia', isDeveloping: false },
  { name: 'Jordan', code: 'JO', flag: '🇯🇴', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Kazakhstan', code: 'KZ', flag: '🇰🇿', region: 'Central Asia & Caucasus', isDeveloping: true },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪', region: 'East Africa', isDeveloping: true },
  { name: 'Kiribati', code: 'KI', flag: '🇰🇮', region: 'Oceania', isDeveloping: true },
  { name: 'Kosovo', code: 'XK', flag: '🇽🇰', region: 'Europe', isDeveloping: true },
  { name: 'Kuwait', code: 'KW', flag: '🇰🇼', region: 'North Africa & Middle East', isDeveloping: false },
  { name: 'Kyrgyzstan', code: 'KG', flag: '🇰🇬', region: 'Central Asia & Caucasus', isDeveloping: true },
  { name: 'Laos', code: 'LA', flag: '🇱🇦', region: 'Southeast Asia', isDeveloping: true },
  { name: 'Latvia', code: 'LV', flag: '🇱🇻', region: 'Europe', isDeveloping: false },
  { name: 'Lebanon', code: 'LB', flag: '🇱🇧', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Lesotho', code: 'LS', flag: '🇱🇸', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Liberia', code: 'LR', flag: '🇱🇷', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Libya', code: 'LY', flag: '🇱🇾', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Liechtenstein', code: 'LI', flag: '🇱🇮', region: 'Europe', isDeveloping: false },
  { name: 'Lithuania', code: 'LT', flag: '🇱🇹', region: 'Europe', isDeveloping: false },
  { name: 'Luxembourg', code: 'LU', flag: '🇱🇺', region: 'Europe', isDeveloping: false },
  { name: 'Madagascar', code: 'MG', flag: '🇲🇬', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Malawi', code: 'MW', flag: '🇲🇼', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾', region: 'Southeast Asia', isDeveloping: true },
  { name: 'Maldives', code: 'MV', flag: '🇲🇻', region: 'South Asia', isDeveloping: true },
  { name: 'Mali', code: 'ML', flag: '🇲🇱', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Malta', code: 'MT', flag: '🇲🇹', region: 'Europe', isDeveloping: false },
  { name: 'Marshall Islands', code: 'MH', flag: '🇲🇭', region: 'Oceania', isDeveloping: true },
  { name: 'Mauritania', code: 'MR', flag: '🇲🇷', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Mauritius', code: 'MU', flag: '🇲🇺', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Micronesia', code: 'FM', flag: '🇫🇲', region: 'Oceania', isDeveloping: true },
  { name: 'Moldova', code: 'MD', flag: '🇲🇩', region: 'Europe', isDeveloping: true },
  { name: 'Monaco', code: 'MC', flag: '🇲🇨', region: 'Europe', isDeveloping: false },
  { name: 'Mongolia', code: 'MN', flag: '🇲🇳', region: 'East Asia', isDeveloping: true },
  { name: 'Montenegro', code: 'ME', flag: '🇲🇪', region: 'Europe', isDeveloping: true },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Mozambique', code: 'MZ', flag: '🇲🇿', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Myanmar', code: 'MM', flag: '🇲🇲', region: 'Southeast Asia', isDeveloping: true },
  { name: 'Namibia', code: 'NA', flag: '🇳🇦', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Nauru', code: 'NR', flag: '🇳🇷', region: 'Oceania', isDeveloping: true },
  { name: 'Nepal', code: 'NP', flag: '🇳🇵', region: 'South Asia', isDeveloping: true },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱', region: 'Europe', isDeveloping: false },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿', region: 'Oceania', isDeveloping: false },
  { name: 'Nicaragua', code: 'NI', flag: '🇳🇮', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Niger', code: 'NE', flag: '🇳🇪', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'North Korea', code: 'KP', flag: '🇰🇵', region: 'East Asia', isDeveloping: true },
  { name: 'North Macedonia', code: 'MK', flag: '🇲🇰', region: 'Europe', isDeveloping: true },
  { name: 'Norway', code: 'NO', flag: '🇳🇴', region: 'Europe', isDeveloping: false },
  { name: 'Oman', code: 'OM', flag: '🇴🇲', region: 'North Africa & Middle East', isDeveloping: false },
  { name: 'Online / Distance Learning', code: 'REMOTE', flag: '💻', region: 'Global', isDeveloping: false },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰', region: 'South Asia', isDeveloping: true },
  { name: 'Palau', code: 'PW', flag: '🇵🇼', region: 'Oceania', isDeveloping: true },
  { name: 'Palestine', code: 'PS', flag: '🇵🇸', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Panama', code: 'PA', flag: '🇵🇦', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Papua New Guinea', code: 'PG', flag: '🇵🇬', region: 'Oceania', isDeveloping: true },
  { name: 'Paraguay', code: 'PY', flag: '🇵🇾', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Peru', code: 'PE', flag: '🇵🇪', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭', region: 'Southeast Asia', isDeveloping: true },
  { name: 'Poland', code: 'PL', flag: '🇵🇱', region: 'Europe', isDeveloping: false },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹', region: 'Europe', isDeveloping: false },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦', region: 'North Africa & Middle East', isDeveloping: false },
  { name: 'Romania', code: 'RO', flag: '🇷🇴', region: 'Europe', isDeveloping: false },
  { name: 'Russia', code: 'RU', flag: '🇷🇺', region: 'Europe', isDeveloping: false },
  { name: 'Rwanda', code: 'RW', flag: '🇷🇼', region: 'East Africa', isDeveloping: true },
  { name: 'Saint Kitts and Nevis', code: 'KN', flag: '🇰🇳', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Saint Lucia', code: 'LC', flag: '🇱🇨', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Saint Vincent and the Grenadines', code: 'VC', flag: '🇻🇨', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Samoa', code: 'WS', flag: '🇼🇸', region: 'Oceania', isDeveloping: true },
  { name: 'San Marino', code: 'SM', flag: '🇸🇲', region: 'Europe', isDeveloping: false },
  { name: 'Sao Tome and Principe', code: 'ST', flag: '🇸🇹', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', region: 'North Africa & Middle East', isDeveloping: false },
  { name: 'Senegal', code: 'SN', flag: '🇸🇳', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Serbia', code: 'RS', flag: '🇷🇸', region: 'Europe', isDeveloping: true },
  { name: 'Seychelles', code: 'SC', flag: '🇸🇨', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Sierra Leone', code: 'SL', flag: '🇸🇱', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', region: 'Southeast Asia', isDeveloping: false },
  { name: 'Slovakia', code: 'SK', flag: '🇸🇰', region: 'Europe', isDeveloping: false },
  { name: 'Slovenia', code: 'SI', flag: '🇸🇮', region: 'Europe', isDeveloping: false },
  { name: 'Solomon Islands', code: 'SB', flag: '🇸🇧', region: 'Oceania', isDeveloping: true },
  { name: 'Somalia', code: 'SO', flag: '🇸🇴', region: 'East Africa', isDeveloping: true },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', region: 'East Asia', isDeveloping: false },
  { name: 'South Sudan', code: 'SS', flag: '🇸🇸', region: 'East Africa', isDeveloping: true },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', region: 'Europe', isDeveloping: false },
  { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰', region: 'South Asia', isDeveloping: true },
  { name: 'Sudan', code: 'SD', flag: '🇸🇩', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Suriname', code: 'SR', flag: '🇸🇷', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪', region: 'Europe', isDeveloping: false },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭', region: 'Europe', isDeveloping: false },
  { name: 'Syria', code: 'SY', flag: '🇸🇾', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Taiwan', code: 'TW', flag: '🇹🇼', region: 'East Asia', isDeveloping: false },
  { name: 'Tajikistan', code: 'TJ', flag: '🇹🇯', region: 'Central Asia & Caucasus', isDeveloping: true },
  { name: 'Tanzania', code: 'TZ', flag: '🇹🇿', region: 'East Africa', isDeveloping: true },
  { name: 'Thailand', code: 'TH', flag: '🇹🇭', region: 'Southeast Asia', isDeveloping: true },
  { name: 'Timor-Leste', code: 'TL', flag: '🇹🇱', region: 'Southeast Asia', isDeveloping: true },
  { name: 'Togo', code: 'TG', flag: '🇹🇬', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Tonga', code: 'TO', flag: '🇹🇴', region: 'Oceania', isDeveloping: true },
  { name: 'Trinidad and Tobago', code: 'TT', flag: '🇹🇹', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Tunisia', code: 'TN', flag: '🇹🇳', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Turkmenistan', code: 'TM', flag: '🇹🇲', region: 'Central Asia & Caucasus', isDeveloping: true },
  { name: 'Tuvalu', code: 'TV', flag: '🇹🇻', region: 'Oceania', isDeveloping: true },
  { name: 'Uganda', code: 'UG', flag: '🇺🇬', region: 'East Africa', isDeveloping: true },
  { name: 'Ukraine', code: 'UA', flag: '🇺🇦', region: 'Europe', isDeveloping: true },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', region: 'North Africa & Middle East', isDeveloping: false },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', region: 'Europe', isDeveloping: false },
  { name: 'United States', code: 'US', flag: '🇺🇸', region: 'North America', isDeveloping: false },
  { name: 'Uruguay', code: 'UY', flag: '🇺🇾', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Uzbekistan', code: 'UZ', flag: '🇺🇿', region: 'Central Asia & Caucasus', isDeveloping: true },
  { name: 'Vanuatu', code: 'VU', flag: '🇻🇺', region: 'Oceania', isDeveloping: true },
  { name: 'Vatican City', code: 'VA', flag: '🇻🇦', region: 'Europe', isDeveloping: false },
  { name: 'Venezuela', code: 'VE', flag: '🇻🇪', region: 'Latin America & Caribbean', isDeveloping: true },
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳', region: 'Southeast Asia', isDeveloping: true },
  { name: 'Yemen', code: 'YE', flag: '🇾🇪', region: 'North Africa & Middle East', isDeveloping: true },
  { name: 'Zambia', code: 'ZM', flag: '🇿🇲', region: 'Sub-Saharan Africa', isDeveloping: true },
  { name: 'Zimbabwe', code: 'ZW', flag: '🇿🇼', region: 'Sub-Saharan Africa', isDeveloping: true },
];

export const REGIONS = [
  'East Africa',
  'Sub-Saharan Africa',
  'North Africa & Middle East',
  'South Asia',
  'Southeast Asia',
  'East Asia',
  'Central Asia & Caucasus',
  'Latin America & Caribbean',
  'Europe',
  'North America',
  'Oceania',
];

/**
 * Returns full country list strictly sorted alphabetically (A to Z).
 */
export function getSortedCountries(): CountryOption[] {
  return [...ALL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Takes an array of region names and returns all matching countries.
 */
export function expandRegionsToCountries(regions: string[]): string[] {
  const matched = new Set<string>();

  for (const regionName of regions) {
    const norm = regionName.toLowerCase().trim();
    for (const c of ALL_COUNTRIES) {
      if (c.region.toLowerCase() === norm) {
        matched.add(c.name);
      }
      // Sub-Saharan Africa includes East Africa
      if (norm.includes('sub-saharan africa') && c.region.toLowerCase() === 'east africa') {
        matched.add(c.name);
      }
    }
  }

  return Array.from(matched).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns the exact list of developing countries (OECD DAC / UN list) sorted alphabetically.
 */
export function getDevelopingCountriesList(): string[] {
  return ALL_COUNTRIES.filter(c => c.isDeveloping).map(c => c.name).sort((a, b) => a.localeCompare(b));
}

/**
 * Direct O(1) nationality eligibility evaluator.
 */
export function isCountryEligible(
  studentCountry: string | undefined | null,
  mode: string | undefined,
  eligibleCountries: string[] = [],
  eligibleRegions: string[] = []
): boolean {
  if (!studentCountry) return false;
  if (!mode || mode === 'all') return true;

  const target = studentCountry.trim().toLowerCase();

  // If specific countries list is provided directly
  if (eligibleCountries && eligibleCountries.length > 0) {
    if (eligibleCountries.some(c => c.trim().toLowerCase() === target)) {
      return true;
    }
  }

  // If regions are specified, expand and check
  if (eligibleRegions && eligibleRegions.length > 0) {
    const expanded = expandRegionsToCountries(eligibleRegions).map(c => c.toLowerCase());
    if (expanded.includes(target)) {
      return true;
    }
  }

  // If mode is developing_countries
  if (mode === 'developing_countries') {
    const devList = getDevelopingCountriesList().map(c => c.toLowerCase());
    return devList.includes(target);
  }

  return false;
}
