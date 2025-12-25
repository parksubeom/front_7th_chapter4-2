/**
 * @file schedule.utils.ts
 * @description 시간표 파싱 및 비트마스크 변환 등 핵심 유틸리티 함수 모음입니다.
 * 가독성을 위해 메인 로직을 상단에, 세부 헬퍼 함수를 하단에 배치했습니다.
 */

/**
 * 시간표 문자열을 파싱하여 UI에서 사용할 수 있는 객체 배열로 변환합니다.
 *
 * @param schedule - 서버에서 받아온 raw 시간표 문자열 (예: "월1~2(303)<p>화3(202)")
 * @returns {Array} 요일, 교시 범위, 강의실 정보가 담긴 객체 배열
 *
 * @example
 * const result = parseSchedule("월1~2(303)");
 * // result: [{ day: "월", range: [1, 2], room: "303" }]
 */
export function parseSchedule(schedule: string) {
  const schedules = schedule.split("<p>");

  return schedules.map((schedule) => {
    // 하단에 정의된 정규식 함수 호출 (Hoisting 활용)
    const reg = getScheduleRegex();

    const [day] = schedule.split(/(\d+)/);

    // 하단에 정의된 range 계산 함수 호출
    const range = getTimeRange(schedule.replace(reg, "$2"));

    const room = schedule.replace(reg, "$4")?.replace(/\(|\)/g, "");

    return { day, range, room };
  });
}

/**
 * 시간표 문자열을 고유한 BigInt 비트마스크로 변환합니다.
 *
 * 이 함수는 O(N)의 배열 순회 비교를 O(1)의 비트 연산으로 최적화하기 위해 사용됩니다.
 * 월요일 1교시부터 순서대로 비트를 할당하여, 겹치는 시간표를 즉시 판단할 수 있습니다.
 *
 * @param schedule - 파싱할 시간표 문자열
 * @returns {bigint} 시간표 정보가 비트로 마킹된 정수
 *
 * @example
 * // 월요일(0번째 요일) 1교시(0번째 비트) -> 2^0 = 1n
 * getScheduleMask("월1"); // 1n
 */
export function getScheduleMask(schedule: string): bigint {
  let totalMask = 0n;

  // 비트 생성에 필요한 상수와 로직을 가져옵니다.
  const { BIT_SHIFT, dayToIndex } = getBitmaskConstants();

  const schedules = schedule.split("<p>");

  schedules.forEach((chunk) => {
    // 정규식: 요일, 시작교시, (선택)종료교시 추출
    const match = chunk.match(/^([가-힣])(\d+)(?:~(\d+))?/);
    if (!match) return;

    const [, day, startStr, endStr] = match;
    const dayIndex = dayToIndex[day];

    // 유효하지 않은 요일이면 건너뜀
    if (dayIndex === undefined) return;

    const start = parseInt(startStr);
    const end = endStr ? parseInt(endStr) : start;

    // 요일별 비트 오프셋 계산 (예: 화요일은 16비트 밀어서 시작)
    const baseShift = BigInt(dayIndex) * BIT_SHIFT;

    for (let i = start; i <= end; i++) {
      // (요일 오프셋) + (교시 - 1) 위치의 비트를 1로 켭니다.
      // 예: 월요일 1교시 -> 0 + 0 = 0번째 비트
      const bitPosition = baseShift + BigInt(i - 1);
      totalMask |= 1n << bitPosition;
    }
  });

  return totalMask;
}

/**
 * 숫자를 2자리 문자열로 변환합니다. (1 -> "01")
 *
 * @param n - 변환할 숫자
 */
export function fill2(n: number) {
  return `0${n}`.substr(-2);
}

/**
 * 타임스탬프를 "HH:MM" 형식의 문자열로 변환합니다.
 *
 * @param current - Date 타임스탬프
 */
export function parseHnM(current: number) {
  const date = new Date(current);
  return `${fill2(date.getHours())}:${fill2(date.getMinutes())}`;
}

// ----------------------------------------------------------------------
// 🔽 아래는 내부 구현 로직과 상수들입니다. (Details)
// ----------------------------------------------------------------------

/**
 * 시간표 파싱에 사용되는 정규식을 반환합니다.
 * 함수로 감싸두어 호이스팅 효과를 얻고, 메인 로직의 가독성을 높입니다.
 */
function getScheduleRegex() {
  return /^([가-힣])(\d+(~\d+)?)(.*)/;
}

/**
 * "1~3" 형태의 문자열을 [1, 2, 3] 배열로 변환합니다.
 * 단일 교시("5")인 경우 [5]를 반환합니다.
 */
function getTimeRange(value: string): number[] {
  const [start, end] = value.split("~").map(Number);
  if (end === undefined) return [start];
  return Array(end - start + 1)
    .fill(start)
    .map((v, k) => v + k);
}

/**
 * 비트마스크 연산에 필요한 상수와 매핑 정보를 반환합니다.
 * 이 데이터들이 메인 로직의 시야를 가리지 않도록 하단에 배치했습니다.
 */
function getBitmaskConstants() {
  // 하루 최대 교시 수 (비트 충돌 방지를 위해 넉넉하게 16비트 할당)
  const BIT_SHIFT = 16n;

  const dayToIndex: Record<string, number> = {
    월: 0,
    화: 1,
    수: 2,
    목: 3,
    금: 4,
    토: 5,
    일: 6,
  };

  return { BIT_SHIFT, dayToIndex };
}
