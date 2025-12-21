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

// 검색 최적화 필드(titleLower, idLower) 추가
export interface LectureWithSchedule extends Lecture {
  schedules: ParsedSchedule[];
  titleLower: string; // 검색용: 소문자 제목
  idLower: string; // 검색용: 소문자 ID
}

export interface LectureRowProps {
  lectures: LectureWithSchedule[];
  addSchedule: (lecture: Lecture) => void;
}
