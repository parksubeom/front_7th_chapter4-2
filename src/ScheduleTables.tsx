import { Button, ButtonGroup, Flex, Heading, Stack } from "@chakra-ui/react";
import { ScheduleTable } from "./ScheduleTable.tsx";
import { useScheduleContext, useScheduleDispatch, useScheduleIds } from "./ScheduleContext.tsx";
import SearchDialog from "./SearchDialog.tsx";
import { memo } from "react";

// [Container]
const ScheduleTableContainer = memo(
  ({ tableId, index }: { tableId: string; index: number }) => {
    // 1. 데이터 구독 (변하는 부분)
    const { schedulesMap } = useScheduleContext();
    const schedules = schedulesMap[tableId] || [];
    
    // 2. 액션 구독 (변하지 않는 부분 - 불변 핸들러)
    // Context에서 가져온 이 함수들은 절대 참조값이 변하지 않습니다.
    const { onSearch, onDuplicate, onRemove, onScheduleTimeClick, onDeleteButtonClick } = useScheduleDispatch();
    const { tableIds } = useScheduleIds();
    const disabledRemoveButton = tableIds.length === 1;

    return (
      <Stack width="600px">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h3" fontSize="lg">시간표 {index + 1}</Heading>
          <ButtonGroup size="sm" isAttached>
            <Button colorScheme="green" onClick={() => onSearch(tableId)}>시간표 추가</Button>
            <Button colorScheme="green" mx="1px" onClick={() => onDuplicate(tableId)}>복제</Button>
            <Button colorScheme="green" isDisabled={disabledRemoveButton} onClick={() => onRemove(tableId)}>삭제</Button>
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
  // 부모는 이제 ID 목록만 바라봅니다.
  const { tableIds } = useScheduleIds();
  const { searchInfo } = useScheduleContext();
  const { onCloseSearch } = useScheduleDispatch();

  return (
    <>
      <Flex w="full" gap={6} p={6} flexWrap="wrap">
        {tableIds.map((tableId, index) => (
          <ScheduleTableContainer
            key={tableId}
            tableId={tableId}
            index={index}
          />
        ))}
      </Flex>
      <SearchDialog
        searchInfo={searchInfo}
        onClose={onCloseSearch}
      />
    </>
  );
};