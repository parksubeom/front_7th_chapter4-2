import { Button, ButtonGroup, Flex, Heading, Stack } from "@chakra-ui/react";
import ScheduleTable from "./ScheduleTable.tsx";
import { useScheduleContext } from "./ScheduleContext.tsx";
import SearchDialog from "./SearchDialog.tsx";
import { useState, useCallback, memo } from "react";
import { Schedule } from "./types.ts";

// 시간표 하나를 감싸는 래퍼 컴포넌트 분리 및 메모이제이션
// 이 컴포넌트는 props가 변하지 않는 한 부모가 리렌더링되어도 다시 그려지지 않습니다.
const ScheduleTableWrapper = memo(
  ({
    tableId,
    index,
    schedules,
    disabledRemoveButton,
    onSearch,
    onDuplicate,
    onRemove,
    onScheduleTimeClick,
    onDeleteButtonClick,
  }: {
    tableId: string;
    index: number;
    schedules: Schedule[];
    disabledRemoveButton: boolean;
    onSearch: (tableId: string) => void;
    onDuplicate: (tableId: string) => void;
    onRemove: (tableId: string) => void;
    onScheduleTimeClick: (
      tableId: string,
      timeInfo: { day: string; time: number }
    ) => void;
    onDeleteButtonClick: (
      tableId: string,
      timeInfo: { day: string; time: number }
    ) => void;
  }) => {
    return (
      <Stack width="600px">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h3" fontSize="lg">
            시간표 {index + 1}
          </Heading>
          <ButtonGroup size="sm" isAttached>
            <Button colorScheme="green" onClick={() => onSearch(tableId)}>
              시간표 추가
            </Button>
            <Button colorScheme="green" mx="1px" onClick={() => onDuplicate(tableId)}>
              복제
            </Button>
            <Button
              colorScheme="green"
              isDisabled={disabledRemoveButton}
              onClick={() => onRemove(tableId)}
            >
              삭제
            </Button>
          </ButtonGroup>
        </Flex>
        <ScheduleTable
          schedules={schedules}
          tableId={tableId}
          onScheduleTimeClick={onScheduleTimeClick}
          onDeleteButtonClick={onDeleteButtonClick}
        />
      </Stack>
    );
  }
);

export const ScheduleTables = () => {
  const { schedulesMap, setSchedulesMap } = useScheduleContext();
  const [searchInfo, setSearchInfo] = useState<{
    tableId: string;
    day?: string;
    time?: number;
  } | null>(null);

  const disabledRemoveButton = Object.keys(schedulesMap).length === 1;

  // 버튼 클릭 핸들러들도 모두 메모이제이션 처리
  const handleSearch = useCallback((tableId: string) => {
    setSearchInfo({ tableId });
  }, []);

  const handleDuplicate = useCallback((targetId: string) => {
    setSchedulesMap((prev) => ({
      ...prev,
      [`schedule-${Date.now()}`]: [...prev[targetId]],
    }));
  }, [setSchedulesMap]);

  const handleRemove = useCallback((targetId: string) => {
    setSchedulesMap((prev) => {
      delete prev[targetId];
      return { ...prev };
    });
  }, [setSchedulesMap]);

  const handleScheduleTimeClick = useCallback(
    (tableId: string, timeInfo: { day: string; time: number }) => {
      setSearchInfo({ tableId, ...timeInfo });
    },
    []
  );

  const handleDeleteButtonClick = useCallback(
    (tableId: string, { day, time }: { day: string; time: number }) => {
      setSchedulesMap((prev) => ({
        ...prev,
        [tableId]: prev[tableId].filter(
          (schedule) => schedule.day !== day || !schedule.range.includes(time)
        ),
      }));
    },
    [setSchedulesMap]
  );

  return (
    <>
      <Flex w="full" gap={6} p={6} flexWrap="wrap">
        {Object.entries(schedulesMap).map(([tableId, schedules], index) => (
          <ScheduleTableWrapper
            key={tableId}
            tableId={tableId}
            index={index}
            schedules={schedules}
            disabledRemoveButton={disabledRemoveButton}
            onSearch={handleSearch}
            onDuplicate={handleDuplicate}
            onRemove={handleRemove}
            onScheduleTimeClick={handleScheduleTimeClick}
            onDeleteButtonClick={handleDeleteButtonClick}
          />
        ))}
      </Flex>
      <SearchDialog
        searchInfo={searchInfo}
        onClose={() => setSearchInfo(null)}
      />
    </>
  );
};