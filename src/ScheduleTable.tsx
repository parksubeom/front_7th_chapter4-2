import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import { CellSize, DAY_LABELS, 분 } from "./constants.ts";
import { Schedule } from "./types.ts";
import { fill2, parseHnM } from "./utils.ts";
import { useDndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ComponentProps, Fragment, memo } from "react";

interface Props {
  tableId: string;
  schedules: Schedule[];
  // 부모에서 넘겨주는 핸들러 형태에 맞춰 tableId 인자 추가
  onScheduleTimeClick?: (
    tableId: string,
    timeInfo: { day: string; time: number }
  ) => void;
  onDeleteButtonClick?: (
    tableId: string,
    timeInfo: { day: string; time: number }
  ) => void;
}

const TIMES = [
  ...Array(18)
    .fill(0)
    .map((v, k) => v + k * 30 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 30 * 분)}`),

  ...Array(6)
    .fill(18 * 30 * 분)
    .map((v, k) => v + k * 55 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 50 * 분)}`),
] as const;

// ScheduleTable에 memo 적용
// 부모 컴포넌트(ScheduleTables)가 리렌더링되어도 props가 같다면 재렌더링되지 않음
const ScheduleTable = memo(
  ({
    tableId,
    schedules,
    onScheduleTimeClick,
    onDeleteButtonClick,
  }: Props) => {
    const getColor = (lectureId: string): string => {
      const lectures = [
        ...new Set(schedules.map(({ lecture }) => lecture?.id)),
      ];
      const colors = ["#fdd", "#ffd", "#dff", "#ddf", "#fdf", "#dfd"];
      return colors[lectures.indexOf(lectureId) % colors.length];
    };

    const dndContext = useDndContext();

    const getActiveTableId = () => {
      const activeId = dndContext.active?.id;
      if (activeId) {
        return String(activeId).split(":")[0];
      }
      return null;
    };

    const activeTableId = getActiveTableId();

    return (
      <Box
        position="relative"
        outline={activeTableId === tableId ? "5px dashed" : undefined}
        outlineColor="blue.300"
      >
        <Grid
          templateColumns={`120px repeat(${DAY_LABELS.length}, ${CellSize.WIDTH}px)`}
          templateRows={`40px repeat(${TIMES.length}, ${CellSize.HEIGHT}px)`}
          bg="white"
          fontSize="sm"
          textAlign="center"
          outline="1px solid"
          outlineColor="gray.300"
        >
          <GridItem key="교시" borderColor="gray.300" bg="gray.100">
            <Flex justifyContent="center" alignItems="center" h="full" w="full">
              <Text fontWeight="bold">교시</Text>
            </Flex>
          </GridItem>
          {DAY_LABELS.map((day) => (
            <GridItem
              key={day}
              borderLeft="1px"
              borderColor="gray.300"
              bg="gray.100"
            >
              <Flex justifyContent="center" alignItems="center" h="full">
                <Text fontWeight="bold">{day}</Text>
              </Flex>
            </GridItem>
          ))}
          {TIMES.map((time, timeIndex) => (
            <Fragment key={`시간-${timeIndex + 1}`}>
              <GridItem
                borderTop="1px solid"
                borderColor="gray.300"
                bg={timeIndex > 17 ? "gray.200" : "gray.100"}
              >
                <Flex justifyContent="center" alignItems="center" h="full">
                  <Text fontSize="xs">
                    {fill2(timeIndex + 1)} ({time})
                  </Text>
                </Flex>
              </GridItem>
              {DAY_LABELS.map((day) => (
                <GridItem
                  key={`${day}-${timeIndex + 2}`}
                  borderWidth="1px 0 0 1px"
                  borderColor="gray.300"
                  bg={timeIndex > 17 ? "gray.100" : "white"}
                  cursor="pointer"
                  _hover={{ bg: "yellow.100" }}
                  // [수정 3] 핸들러 호출 시 tableId 전달
                  onClick={() =>
                    onScheduleTimeClick?.(tableId, {
                      day,
                      time: timeIndex + 1,
                    })
                  }
                />
              ))}
            </Fragment>
          ))}
        </Grid>

        {schedules.map((schedule, index) => {
          if (!schedule.lecture) return null; // Guard Clause

          return (
            <DraggableSchedule
              key={`${schedule.lecture.title}-${index}`}
              id={`${tableId}:${index}`}
              data={schedule}
              bg={getColor(schedule.lecture.id)}
              // 핸들러 호출 시 tableId 전달
              onDeleteButtonClick={() =>
                onDeleteButtonClick?.(tableId, {
                  day: schedule.day,
                  time: schedule.range[0],
                })
              }
            />
          );
        })}
      </Box>
    );
  }
);

// DraggableSchedule에 memo 적용 및 커스텀 비교 함수(Comparator) 구현
const DraggableSchedule = memo(
  ({
    id,
    data,
    bg,
    onDeleteButtonClick,
  }: { id: string; data: Schedule } & ComponentProps<typeof Box> & {
      onDeleteButtonClick: () => void;
    }) => {
    const { day, range, room, lecture } = data;
    const { attributes, setNodeRef, listeners, transform } = useDraggable({
      id,
    });
    const leftIndex = DAY_LABELS.indexOf(day as (typeof DAY_LABELS)[number]);
    const topIndex = range[0] - 1;
    const size = range.length;

    return (
      <Popover>
        <PopoverTrigger>
          <Box
            position="absolute"
            left={`${120 + CellSize.WIDTH * leftIndex + 1}px`}
            top={`${40 + (topIndex * CellSize.HEIGHT + 1)}px`}
            width={CellSize.WIDTH - 1 + "px"}
            height={CellSize.HEIGHT * size - 1 + "px"}
            bg={bg}
            p={1}
            boxSizing="border-box"
            cursor="pointer"
            ref={setNodeRef}
            transform={CSS.Translate.toString(transform)}
            {...listeners}
            {...attributes}
          >
            <Text fontSize="sm" fontWeight="bold">
              {lecture?.title}
            </Text>
            <Text fontSize="xs">{room}</Text>
          </Box>
        </PopoverTrigger>
        <PopoverContent onClick={(event) => event.stopPropagation()}>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>
            <Text>강의를 삭제하시겠습니까?</Text>
            <Button colorScheme="red" size="xs" onClick={onDeleteButtonClick}>
              삭제
            </Button>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  },
  // 비교 함수: id, data, bg가 변하지 않으면 리렌더링 건너뜀
  // onDeleteButtonClick은 매번 새로운 함수가 들어오므로 비교 대상에서 제외하여 렌더링 방어
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.data === nextProps.data &&
      prevProps.bg === nextProps.bg
    );
  }
);

export default ScheduleTable;