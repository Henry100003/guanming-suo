// 真太陽時：把「鐘錶時間」換算成出生地的實際太陽時，用於排時柱。
// 真太陽時 = 鐘錶時間 − 日光節約時間 + 經度差（每度 4 分鐘）+ 均時差

export interface BirthPlace {
  id: string;
  label: string;
  longitude: number | null; // null = 不校正
  /** 標準時區的中央經線（UTC+8 為 120°E） */
  meridian: number;
  /** 是否套用台灣歷年日光節約時間 */
  taiwanDst: boolean;
}

export const BIRTH_PLACES: BirthPlace[] = [
  ["taipei", "台北市", 121.56], ["newtaipei", "新北市", 121.47], ["keelung", "基隆市", 121.74],
  ["taoyuan", "桃園市", 121.30], ["hsinchu", "新竹縣市", 120.97], ["miaoli", "苗栗縣", 120.82],
  ["taichung", "台中市", 120.68], ["changhua", "彰化縣", 120.54], ["nantou", "南投縣", 120.69],
  ["yunlin", "雲林縣", 120.54], ["chiayi", "嘉義縣市", 120.45], ["tainan", "台南市", 120.21],
  ["kaohsiung", "高雄市", 120.31], ["pingtung", "屏東縣", 120.49], ["yilan", "宜蘭縣", 121.75],
  ["hualien", "花蓮縣", 121.60], ["taitung", "台東縣", 121.14], ["penghu", "澎湖縣", 119.57],
  ["kinmen", "金門縣", 118.32], ["matsu", "連江縣（馬祖）", 119.95],
].map(([id, label, longitude]): BirthPlace => ({ id: id as string, label: label as string, longitude: longitude as number, meridian: 120, taiwanDst: true }))
  .concat([
    { id: "hongkong", label: "香港", longitude: 114.17, meridian: 120, taiwanDst: false },
    { id: "macau", label: "澳門", longitude: 113.54, meridian: 120, taiwanDst: false },
    { id: "other", label: "其他地區（不校正）", longitude: null, meridian: 120, taiwanDst: false },
  ]);

export function findPlace(id: string | undefined | null): BirthPlace | null {
  return BIRTH_PLACES.find((p) => p.id === id) ?? null;
}

// 台灣歷年夏令時間／日光節約時間（起日 00:00 至迄日 00:00，鐘錶撥快 1 小時）
// 資料來源：Wikipedia「Time in Taiwan」，與中央氣象署公告一致；1945 年及更早不處理。
const TW_DST: [number, string, string][] = [
  [1946, "05-15", "10-01"], [1947, "04-15", "11-01"],
  [1948, "05-01", "10-01"], [1949, "05-01", "10-01"], [1950, "05-01", "10-01"], [1951, "05-01", "10-01"],
  [1952, "03-01", "11-01"], [1953, "04-01", "11-01"], [1954, "04-01", "11-01"],
  [1955, "04-01", "10-01"], [1956, "04-01", "10-01"], [1957, "04-01", "10-01"], [1958, "04-01", "10-01"], [1959, "04-01", "10-01"],
  [1960, "06-01", "10-01"], [1961, "06-01", "10-01"],
  [1974, "04-01", "10-01"], [1975, "04-01", "10-01"],
  [1979, "07-01", "10-01"],
];

export function isTaiwanDst(year: number, month: number, day: number): boolean {
  const md = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return TW_DST.some(([y, s, e]) => y === year && md >= s && md < e);
}

/** 均時差（分鐘），常用近似式，誤差約 ±30 秒 */
export function equationOfTime(year: number, month: number, day: number): number {
  const n = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000);
  const b = (2 * Math.PI * (n - 81)) / 365;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

export interface SolarTimeResult {
  year: number; month: number; day: number; hour: number; minute: number;
  placeLabel: string;
  dstMinutes: number; // 扣掉的日光節約分鐘數
  longitudeMinutes: number;
  eotMinutes: number;
  totalMinutes: number;
}

export function toTrueSolarTime(
  t: { year: number; month: number; day: number; hour: number; minute: number },
  place: BirthPlace,
): SolarTimeResult | null {
  if (place.longitude === null) return null;
  const dstMinutes = place.taiwanDst && isTaiwanDst(t.year, t.month, t.day) ? 60 : 0;
  const longitudeMinutes = (place.longitude - place.meridian) * 4;
  const eotMinutes = equationOfTime(t.year, t.month, t.day);
  const totalMinutes = -dstMinutes + longitudeMinutes + eotMinutes;
  const d = new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute) + Math.round(totalMinutes) * 60_000);
  return {
    year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes(),
    placeLabel: place.label,
    dstMinutes,
    longitudeMinutes: Math.round(longitudeMinutes * 10) / 10,
    eotMinutes: Math.round(eotMinutes * 10) / 10,
    totalMinutes: Math.round(totalMinutes * 10) / 10,
  };
}
