import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
  useMemo,
  useRef,
} from "react";
import { Schedule } from "./types.ts";
import dummyScheduleMap from "./dummyScheduleMap.ts";

interface ScheduleContextType {
  schedulesMap: Record<string, Schedule[]>;
  searchInfo: { tableId: string; day?: string; time?: number } | null;
}

interface ScheduleDispatchContextType {
  setSchedulesMap: React.Dispatch<
    React.SetStateAction<Record<string, Schedule[]>>
  >;
  onSearch: (tableId: string) => void;
  onDuplicate: (targetId: string) => void;
  onRemove: (targetId: string) => void;
  onScheduleTimeClick: (
    tableId: string,
    timeInfo: { day: string; time: number }
  ) => void;
  onDeleteButtonClick: (
    tableId: string,
    timeInfo: { day: string; time: number }
  ) => void;
  onCloseSearch: () => void;
}

interface ScheduleIdsContextType {
  tableIds: string[];
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);
const ScheduleDispatchContext = createContext<
  ScheduleDispatchContextType | undefined
>(undefined);
const ScheduleIdsContext = createContext<ScheduleIdsContextType | undefined>(
  undefined
);

export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) throw new Error("useScheduleContext error");
  return context;
};

export const useScheduleDispatch = () => {
  const context = useContext(ScheduleDispatchContext);
  if (context === undefined) throw new Error("useScheduleDispatch error");
  return context;
};

export const useScheduleIds = () => {
  const context = useContext(ScheduleIdsContext);
  if (context === undefined) throw new Error("useScheduleIds error");
  return context;
};

/**
 * [최적화] usePreservedTableIds
 * JSON.stringify(O(N)) 대신 useRef와 얕은 비교를 사용하여
 * 불필요한 연산과 리렌더링을 방지하는 커스텀 훅입니다.
 */
const usePreservedTableIds = (map: Record<string, Schedule[]>) => {
  const idsRef = useRef<string[]>([]);
  const currentIds = Object.keys(map);

  // 1. 길이가 다르면 무조건 변경된 것
  // 2. 길이가 같더라도 내부 요소가 하나라도 다르면 변경된 것
  const hasChanged =
    currentIds.length !== idsRef.current.length ||
    currentIds.some((id, index) => id !== idsRef.current[index]);

  if (hasChanged) {
    idsRef.current = currentIds;
  }

  return idsRef.current;
};

export const ScheduleProvider = ({ children }: PropsWithChildren) => {
  const [schedulesMap, setSchedulesMap] =
    useState<Record<string, Schedule[]>>(dummyScheduleMap);
  const [searchInfo, setSearchInfo] = useState<{
    tableId: string;
    day?: string;
    time?: number;
  } | null>(null);

  // [수정] JSON.stringify 제거 및 최적화 훅 적용
  // 이제 schedulesMap이 아무리 커져도, 키의 변경사항 체크는 매우 빠릅니다.
  const tableIds = usePreservedTableIds(schedulesMap);

  // [핵심] 액션 핸들러들을 영구 고정 (Context Split 패턴 유지)
  const actions = useMemo(
    () => ({
      setSchedulesMap,
      onSearch: (tableId: string) => setSearchInfo({ tableId }),
      onDuplicate: (targetId: string) =>
        setSchedulesMap((prev) => ({
          ...prev,
          [`schedule-${Date.now()}`]: [...prev[targetId]],
        })),
      onRemove: (targetId: string) =>
        setSchedulesMap((prev) => {
          const n = { ...prev };
          delete n[targetId];
          return n;
        }),
      onScheduleTimeClick: (
        tableId: string,
        timeInfo: { day: string; time: number }
      ) => setSearchInfo({ tableId, ...timeInfo }),
      onDeleteButtonClick: (
        tableId: string,
        { day, time }: { day: string; time: number }
      ) =>
        setSchedulesMap((prev) => ({
          ...prev,
          [tableId]: prev[tableId].filter(
            (schedule) => schedule.day !== day || !schedule.range.includes(time)
          ),
        })),
      onCloseSearch: () => setSearchInfo(null),
    }),
    []
  );

  const scheduleValue = useMemo(
    () => ({ schedulesMap, searchInfo }),
    [schedulesMap, searchInfo]
  );

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
