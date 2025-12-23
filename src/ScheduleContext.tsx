import React, { createContext, PropsWithChildren, useContext, useState, useMemo } from "react";
import { Schedule } from "./types.ts";
import dummyScheduleMap from "./dummyScheduleMap.ts";

interface ScheduleContextType {
  schedulesMap: Record<string, Schedule[]>;
  // [추가] 검색 모달 상태도 Context에서 관리
  searchInfo: { tableId: string; day?: string; time?: number } | null;
}

// [핵심] Dispatch 컨텍스트에 '모든 액션 함수'를 정의합니다.
interface ScheduleDispatchContextType {
  setSchedulesMap: React.Dispatch<React.SetStateAction<Record<string, Schedule[]>>>;
  onSearch: (tableId: string) => void;
  onDuplicate: (targetId: string) => void;
  onRemove: (targetId: string) => void;
  onScheduleTimeClick: (tableId: string, timeInfo: { day: string; time: number }) => void;
  onDeleteButtonClick: (tableId: string, timeInfo: { day: string; time: number }) => void;
  onCloseSearch: () => void;
}

interface ScheduleIdsContextType {
  tableIds: string[];
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);
const ScheduleDispatchContext = createContext<ScheduleDispatchContextType | undefined>(undefined);
const ScheduleIdsContext = createContext<ScheduleIdsContextType | undefined>(undefined);

export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) throw new Error('useScheduleContext error');
  return context;
};

export const useScheduleDispatch = () => {
  const context = useContext(ScheduleDispatchContext);
  if (context === undefined) throw new Error('useScheduleDispatch error');
  return context;
};

export const useScheduleIds = () => {
  const context = useContext(ScheduleIdsContext);
  if (context === undefined) throw new Error('useScheduleIds error');
  return context;
};

export const ScheduleProvider = ({ children }: PropsWithChildren) => {
  const [schedulesMap, setSchedulesMap] = useState<Record<string, Schedule[]>>(dummyScheduleMap);
  const [searchInfo, setSearchInfo] = useState<{ tableId: string; day?: string; time?: number } | null>(null);

  // [유지] ID 목록 참조값 고정 (JSON.stringify)
  const tableIds = useMemo(() => Object.keys(schedulesMap), [
    JSON.stringify(Object.keys(schedulesMap))
  ]);

  // [핵심] 모든 핸들러를 여기서 정의하고 memo로 '영구 고정'합니다.
  // 의존성 배열이 [] 이므로, 이 액션 객체와 내부 함수들은 앱 종료 시까지 절대 변하지 않습니다.
  const actions = useMemo(() => ({
    setSchedulesMap, // setSchedulesMap은 이미 React에 의해 고정됨
    onSearch: (tableId: string) => setSearchInfo({ tableId }),
    onDuplicate: (targetId: string) => 
      setSchedulesMap(prev => ({ ...prev, [`schedule-${Date.now()}`]: [...prev[targetId]] })),
    onRemove: (targetId: string) => 
      setSchedulesMap(prev => { const n = { ...prev }; delete n[targetId]; return n; }),
    onScheduleTimeClick: (tableId: string, timeInfo: { day: string; time: number }) => 
      setSearchInfo({ tableId, ...timeInfo }),
    onDeleteButtonClick: (tableId: string, { day, time }: { day: string; time: number }) => 
      setSchedulesMap(prev => ({
        ...prev,
        [tableId]: prev[tableId].filter(schedule => schedule.day !== day || !schedule.range.includes(time)),
      })),
    onCloseSearch: () => setSearchInfo(null),
  }), []);

  const scheduleValue = useMemo(() => ({ schedulesMap, searchInfo }), [schedulesMap, searchInfo]);
  const idsValue = useMemo(() => ({ tableIds }), [tableIds]);

  return (
    <ScheduleContext.Provider value={scheduleValue}>
      <ScheduleIdsContext.Provider value={idsValue}>
        <ScheduleDispatchContext.Provider value={actions}>
          {children}
        </ScheduleDispatchContext.Provider>
      </ScheduleIdsContext.Provider>
    </ScheduleContext.Provider>
  );
};