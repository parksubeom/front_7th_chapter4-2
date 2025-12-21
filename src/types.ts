// src/types.ts

export interface Lecture {
  id: string;
  title: string;
  credits: string;
  major: string;
  schedule: string;
  grade: number;
}

// parseSchedule 함수가 반환하는 순수 스케줄 정보 (Lecture 참조 제외)
export interface ParsedSchedule {
  day: string;
  range: number[];
  room?: string;
}

export interface Schedule {
  lecture?: Lecture;
  day: string;
  range: number[];
  room?: string;
}

//  성능 최적화를 위해 문자열 schedule을 미리 파싱한 정보를 담고 있는 확장 타입
export interface LectureWithSchedule extends Lecture {
  schedules: ParsedSchedule[];
}
