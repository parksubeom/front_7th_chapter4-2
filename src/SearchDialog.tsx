import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  memo,
  useDeferredValue,
  useRef,
} from "react";
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  VStack,
  Wrap,
  // [복귀] 기존 Table 컴포넌트들을 그대로 사용합니다.
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { useScheduleContext } from "./ScheduleContext.tsx";
import { Lecture } from "./types.ts";
import { parseSchedule } from "./utils.ts";
import axios from "axios";
import { DAY_LABELS } from "./constants.ts";
// [신규] DOM 구조를 강제하지 않는 Headless 가상화 라이브러리
import { useVirtualizer } from "@tanstack/react-virtual";

interface Props {
  searchInfo: {
    tableId: string;
    day?: string;
    time?: number;
  } | null;
  onClose: () => void;
}

interface SearchOption {
  query?: string;
  grades: number[];
  days: string[];
  times: number[];
  majors: string[];
  credits?: number;
}

interface LectureWithSchedule extends Lecture {
  schedules: ReturnType<typeof parseSchedule>;
  titleLower: string;
  idLower: string;
}

const TIME_SLOTS = [
  { id: 1, label: "09:00~09:30" },
  { id: 2, label: "09:30~10:00" },
  { id: 3, label: "10:00~10:30" },
  { id: 4, label: "10:30~11:00" },
  { id: 5, label: "11:00~11:30" },
  { id: 6, label: "11:30~12:00" },
  { id: 7, label: "12:00~12:30" },
  { id: 8, label: "12:30~13:00" },
  { id: 9, label: "13:00~13:30" },
  { id: 10, label: "13:30~14:00" },
  { id: 11, label: "14:00~14:30" },
  { id: 12, label: "14:30~15:00" },
  { id: 13, label: "15:00~15:30" },
  { id: 14, label: "15:30~16:00" },
  { id: 15, label: "16:00~16:30" },
  { id: 16, label: "16:30~17:00" },
  { id: 17, label: "17:00~17:30" },
  { id: 18, label: "17:30~18:00" },
  { id: 19, label: "18:00~18:50" },
  { id: 20, label: "18:55~19:45" },
  { id: 21, label: "19:50~20:40" },
  { id: 22, label: "20:45~21:35" },
  { id: 23, label: "21:40~22:30" },
  { id: 24, label: "22:35~23:25" },
];

const fetchMajors = () => axios.get<Lecture[]>("/schedules-majors.json");
const fetchLiberalArts = () =>
  axios.get<Lecture[]>("/schedules-liberal-arts.json");

const fetchAllLectures = async () => {
  const start = performance.now();
  console.log("API 호출 시작: ", start);

  const majorsPromise = fetchMajors();
  const liberalArtsPromise = fetchLiberalArts();

  const results = await Promise.all([majorsPromise, liberalArtsPromise]);

  const end = performance.now();
  console.log("모든 API 호출 완료 ", end);
  console.log("API 호출에 걸린 시간(ms): ", end - start);

  return results;
};

// --- 하위 컴포넌트들 (기존 유지) ---
const GradeCheckboxGroup = memo(
  ({
    grades,
    onChange,
  }: {
    grades: number[];
    onChange: (v: number[]) => void;
  }) => (
    <FormControl>
      <FormLabel>학년</FormLabel>
      <CheckboxGroup
        value={grades}
        onChange={(value) => onChange(value.map(Number))}
      >
        <HStack spacing={4}>
          {[1, 2, 3, 4].map((grade) => (
            <Checkbox key={grade} value={grade}>
              {grade}학년
            </Checkbox>
          ))}
        </HStack>
      </CheckboxGroup>
    </FormControl>
  )
);

const DayCheckboxGroup = memo(
  ({ days, onChange }: { days: string[]; onChange: (v: string[]) => void }) => (
    <FormControl>
      <FormLabel>요일</FormLabel>
      <CheckboxGroup
        value={days}
        onChange={(value) => onChange(value as string[])}
      >
        <HStack spacing={4}>
          {DAY_LABELS.map((day) => (
            <Checkbox key={day} value={day}>
              {day}
            </Checkbox>
          ))}
        </HStack>
      </CheckboxGroup>
    </FormControl>
  )
);

const TimeCheckboxGroup = memo(
  ({
    times,
    onChange,
  }: {
    times: number[];
    onChange: (v: number[]) => void;
  }) => (
    <FormControl>
      <FormLabel>시간</FormLabel>
      <CheckboxGroup
        colorScheme="green"
        value={times}
        onChange={(values) => onChange(values.map(Number))}
      >
        <Wrap spacing={1} mb={2}>
          {times
            .sort((a, b) => a - b)
            .map((time) => (
              <Tag key={time} size="sm" variant="outline" colorScheme="blue">
                <TagLabel>{time}교시</TagLabel>
                <TagCloseButton
                  onClick={() => onChange(times.filter((v) => v !== time))}
                />
              </Tag>
            ))}
        </Wrap>
        <Stack
          spacing={2}
          overflowY="auto"
          h="100px"
          border="1px solid"
          borderColor="gray.200"
          borderRadius={5}
          p={2}
        >
          {TIME_SLOTS.map(({ id, label }) => (
            <Box key={id}>
              <Checkbox key={id} size="sm" value={id}>
                {id}교시({label})
              </Checkbox>
            </Box>
          ))}
        </Stack>
      </CheckboxGroup>
    </FormControl>
  )
);

const MajorCheckboxGroup = memo(
  ({
    majors,
    allMajors,
    onChange,
  }: {
    majors: string[];
    allMajors: string[];
    onChange: (v: string[]) => void;
  }) => (
    <FormControl>
      <FormLabel>전공</FormLabel>
      <CheckboxGroup
        colorScheme="green"
        value={majors}
        onChange={(values) => onChange(values as string[])}
      >
        <Wrap spacing={1} mb={2}>
          {majors.map((major) => (
            <Tag key={major} size="sm" variant="outline" colorScheme="blue">
              <TagLabel>{major.split("<p>").pop()}</TagLabel>
              <TagCloseButton
                onClick={() => onChange(majors.filter((v) => v !== major))}
              />
            </Tag>
          ))}
        </Wrap>
        <Stack
          spacing={2}
          overflowY="auto"
          h="100px"
          border="1px solid"
          borderColor="gray.200"
          borderRadius={5}
          p={2}
        >
          {allMajors.map((major) => (
            <Box key={major}>
              <Checkbox key={major} size="sm" value={major}>
                {major.replace(/<p>/gi, " ")}
              </Checkbox>
            </Box>
          ))}
        </Stack>
      </CheckboxGroup>
    </FormControl>
  )
);

const SearchFilter = memo(
  ({
    searchOptions,
    allMajors,
    changeSearchOption,
  }: {
    searchOptions: SearchOption;
    allMajors: string[];
    changeSearchOption: (
      field: keyof SearchOption,
      value: SearchOption[keyof SearchOption]
    ) => void;
  }) => {
    const handleChangeQuery = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) =>
        changeSearchOption("query", e.target.value),
      [changeSearchOption]
    );
    const handleChangeCredits = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) =>
        changeSearchOption("credits", e.target.value),
      [changeSearchOption]
    );
    const handleChangeGrades = useCallback(
      (v: number[]) => changeSearchOption("grades", v),
      [changeSearchOption]
    );
    const handleChangeDays = useCallback(
      (v: string[]) => changeSearchOption("days", v),
      [changeSearchOption]
    );
    const handleChangeTimes = useCallback(
      (v: number[]) => changeSearchOption("times", v),
      [changeSearchOption]
    );
    const handleChangeMajors = useCallback(
      (v: string[]) => changeSearchOption("majors", v),
      [changeSearchOption]
    );

    return (
      <Stack spacing={4}>
        <HStack spacing={4}>
          <FormControl>
            <FormLabel>검색어</FormLabel>
            <Input
              placeholder="과목명 또는 과목코드"
              value={searchOptions.query}
              onChange={handleChangeQuery}
            />
          </FormControl>
          <FormControl>
            <FormLabel>학점</FormLabel>
            <Select
              value={searchOptions.credits}
              onChange={handleChangeCredits}
            >
              <option value="">전체</option>
              <option value="1">1학점</option>
              <option value="2">2학점</option>
              <option value="3">3학점</option>
            </Select>
          </FormControl>
        </HStack>
        <HStack spacing={4}>
          <GradeCheckboxGroup
            grades={searchOptions.grades}
            onChange={handleChangeGrades}
          />
          <DayCheckboxGroup
            days={searchOptions.days}
            onChange={handleChangeDays}
          />
        </HStack>
        <HStack spacing={4}>
          <TimeCheckboxGroup
            times={searchOptions.times}
            onChange={handleChangeTimes}
          />
          <MajorCheckboxGroup
            majors={searchOptions.majors}
            allMajors={allMajors}
            onChange={handleChangeMajors}
          />
        </HStack>
      </Stack>
    );
  }
);

const SearchDialog = ({ searchInfo, onClose }: Props) => {
  const { setSchedulesMap } = useScheduleContext();

  // [가상화] 부모 스크롤 컨테이너 참조 (Box)
  const parentRef = useRef<HTMLDivElement>(null);

  const [lectures, setLectures] = useState<LectureWithSchedule[]>([]);
  const [searchOptions, setSearchOptions] = useState<SearchOption>({
    query: "",
    grades: [],
    days: [],
    times: [],
    majors: [],
  });

  const deferredSearchOptions = useDeferredValue(searchOptions);

  const filteredLectures = useMemo(() => {
    const {
      query = "",
      credits,
      grades,
      days,
      times,
      majors,
    } = deferredSearchOptions;
    const queryLower = query.toLowerCase();

    return lectures
      .filter(
        (lecture) =>
          lecture.titleLower.includes(queryLower) ||
          lecture.idLower.includes(queryLower)
      )
      .filter(
        (lecture) => grades.length === 0 || grades.includes(lecture.grade)
      )
      .filter(
        (lecture) => majors.length === 0 || majors.includes(lecture.major)
      )
      .filter(
        (lecture) => !credits || lecture.credits.startsWith(String(credits))
      )
      .filter(
        (lecture) =>
          days.length === 0 ||
          lecture.schedules.some((s) => days.includes(s.day))
      )
      .filter(
        (lecture) =>
          times.length === 0 ||
          lecture.schedules.some((s) =>
            s.range.some((time) => times.includes(time))
          )
      );
  }, [deferredSearchOptions, lectures]);

  const allMajors = useMemo(
    () => [...new Set(lectures.map((lecture) => lecture.major))],
    [lectures]
  );

  // [핵심] TanStack Virtual 훅 사용
  // 이 녀석이 "어떤 행을 그려야 할지" 계산만 해줍니다. Table 태그 사용 가능!
  const rowVirtualizer = useVirtualizer({
    count: filteredLectures.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65, // 대략적인 행 높이 (자동으로 조정됨)
    overscan: 5, // 스크롤 부드러움을 위해 미리 렌더링할 개수
  });

  const changeSearchOption = useCallback(
    (field: keyof SearchOption, value: SearchOption[typeof field]) => {
      setSearchOptions((prev) => ({ ...prev, [field]: value }));
      // 검색 조건 변경 시 스크롤 초기화
      if (parentRef.current) {
        parentRef.current.scrollTop = 0;
      }
    },
    []
  );

  const addSchedule = useCallback(
    (lecture: Lecture) => {
      if (!searchInfo) return;
      const { tableId } = searchInfo;
      const schedules = parseSchedule(lecture.schedule).map((schedule) => ({
        ...schedule,
        lecture,
      }));
      setSchedulesMap((prev) => ({
        ...prev,
        [tableId]: [...prev[tableId], ...schedules],
      }));
      onClose();
    },
    [searchInfo, setSchedulesMap, onClose]
  );

  useEffect(() => {
    if (!searchInfo || lectures.length > 0) return;

    const start = performance.now();
    console.log("API 호출 시작: ", start);
    fetchAllLectures().then((results) => {
      const end = performance.now();
      console.log("모든 API 호출 완료 ", end);
      console.log("API 호출에 걸린 시간(ms): ", end - start);

      setLectures(
        results.flatMap((result) =>
          result.data.map((lecture) => ({
            ...lecture,
            schedules: lecture.schedule ? parseSchedule(lecture.schedule) : [],
            titleLower: lecture.title.toLowerCase(),
            idLower: lecture.id.toLowerCase(),
          }))
        )
      );
    });
  }, [searchInfo]);

  useEffect(() => {
    setSearchOptions((prev) => ({
      ...prev,
      days: searchInfo?.day ? [searchInfo.day] : [],
      times: searchInfo?.time ? [searchInfo.time] : [],
    }));
  }, [searchInfo]);

  return (
    <Modal isOpen={Boolean(searchInfo)} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxW="90vw" w="1000px" minH="80vh">
        <ModalHeader>수업 검색</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <SearchFilter
              searchOptions={searchOptions}
              allMajors={allMajors}
              changeSearchOption={changeSearchOption}
            />

            <Text align="right">검색결과: {filteredLectures.length}개</Text>

            <Box>
              {/* [1] 헤더: 기존 Table 컴포넌트 유지 */}
              <Table>
                <Thead>
                  <Tr>
                    <Th width="100px">과목코드</Th>
                    <Th width="50px">학년</Th>
                    <Th width="200px">과목명</Th>
                    <Th width="50px">학점</Th>
                    <Th width="150px">전공</Th>
                    <Th width="150px">시간</Th>
                    <Th width="80px"></Th>
                  </Tr>
                </Thead>
              </Table>

              {/* [2] 바디: 원하는 구조(Table > Tbody) 유지 + 가상화 적용 */}
              {/* [2] 바디: 원하는 구조(Table > Tbody) 유지 + 가상화 적용 */}
              {/* [2] 바디: 원하는 구조(Table > Tbody) 유지 + 가상화 적용 */}
              <Box overflowY="auto" maxH="500px" ref={parentRef}>
                <Table size="sm" variant="striped">
                  <Tbody
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const lecture = filteredLectures[virtualRow.index];
                      return (
                        <Tr
                          key={virtualRow.key}
                          data-index={virtualRow.index}
                          ref={rowVirtualizer.measureElement}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,

                            // [핵심 1] 높이 통일의 비밀!
                            display: "flex",
                            alignItems: "stretch", // 자식들(Td)의 높이를 강제로 늘려서 맞춤
                            boxSizing: "border-box",
                          }}
                        >
                          {/* [핵심 2] Td 스타일링
                             - height="auto": 부모(Tr)가 stretch이므로 알아서 꽉 참
                             - alignItems="center": 텍스트는 수직 중앙 정렬
                             - borderBottom: 테이블 선이 끊기지 않도록 명시
                           */}

                          {/* 과목코드: 고정 */}
                          <Td
                            width="100px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            borderBottom="1px solid inherit"
                          >
                            {lecture.id}
                          </Td>

                          {/* 학년: 고정 */}
                          <Td
                            width="50px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            borderBottom="1px solid inherit"
                          >
                            {lecture.grade}
                          </Td>

                          {/* 과목명: 가변 */}
                          <Td
                            flex={1}
                            display="flex"
                            alignItems="center"
                            borderBottom="1px solid inherit"
                            overflow="hidden"
                          >
                            <Text isTruncated w="full">
                              {lecture.title}
                            </Text>
                          </Td>

                          {/* 학점: 고정 */}
                          <Td
                            width="50px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            borderBottom="1px solid inherit"
                          >
                            {lecture.credits}
                          </Td>

                          {/* 전공: 가변 (HTML 렌더링) */}
                          <Td
                            flex={1}
                            display="flex"
                            alignItems="center"
                            borderBottom="1px solid inherit"
                            overflow="hidden"
                          >
                            <Box
                              dangerouslySetInnerHTML={{
                                __html: lecture.major || "",
                              }}
                            />
                          </Td>

                          {/* 시간: 가변 (HTML 렌더링) */}
                          <Td
                            flex={1}
                            display="flex"
                            alignItems="center"
                            borderBottom="1px solid inherit"
                            overflow="hidden"
                          >
                            <Box
                              dangerouslySetInnerHTML={{
                                __html: lecture.schedule || "",
                              }}
                            />
                          </Td>

                          {/* 추가 버튼: 고정 */}
                          <Td
                            width="80px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            borderBottom="1px solid inherit"
                          >
                            <Button
                              size="xs"
                              colorScheme="green"
                              onClick={() => addSchedule(lecture)}
                            >
                              추가
                            </Button>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SearchDialog;
