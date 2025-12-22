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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
} from "@chakra-ui/react";
import { useScheduleContext } from "./ScheduleContext.tsx";
import { Lecture } from "./types.ts";
import { parseSchedule } from "./utils.ts";
import axios from "axios";
import { DAY_LABELS } from "./constants.ts";

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

const fetchMajors = () => axios.get<Lecture[]>("schedules-majors.json");
const fetchLiberalArts = () =>
  axios.get<Lecture[]>("schedules-liberal-arts.json");

const fetchAllLectures = async () => {
  const start = performance.now();
  console.log("API 호출 시작: ", start);
  const results = await Promise.all([fetchMajors(), fetchLiberalArts()]);
  const end = performance.now();
  console.log("모든 API 호출 완료 ", end);
  return results;
};

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

const LectureRow = memo(
  ({
    lecture,
    addSchedule,
  }: {
    lecture: LectureWithSchedule;
    addSchedule: (lecture: Lecture) => void;
  }) => {
    return (
      <Tr>
        <Td width="100px">{lecture.id}</Td>
        <Td width="50px">{lecture.grade}</Td>
        <Td width="200px">{lecture.title}</Td>
        <Td width="50px">{lecture.credits}</Td>
        <Td width="150px" dangerouslySetInnerHTML={{ __html: lecture.major }} />
        <Td
          width="150px"
          dangerouslySetInnerHTML={{ __html: lecture.schedule }}
        />
        <Td width="80px">
          <Button
            size="sm"
            colorScheme="green"
            onClick={() => addSchedule(lecture)}
          >
            추가
          </Button>
        </Td>
      </Tr>
    );
  }
);

const SearchDialog = ({ searchInfo, onClose }: Props) => {
  const { setSchedulesMap } = useScheduleContext();

  const searchInfoRef = useRef(searchInfo);

  useEffect(() => {
    searchInfoRef.current = searchInfo;
  }, [searchInfo]);

  const [lectures, setLectures] = useState<LectureWithSchedule[]>([]);
  const [page, setPage] = useState(1);
  const [searchOptions, setSearchOptions] = useState<SearchOption>({
    query: "",
    grades: [],
    days: [],
    times: [],
    majors: [],
  });

  const deferredSearchOptions = useDeferredValue(searchOptions);

  const scrollRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 20;

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

    return lectures.filter((lecture) => {
      if (
        queryLower &&
        !lecture.titleLower.includes(queryLower) &&
        !lecture.idLower.includes(queryLower)
      )
        return false;
      if (grades.length > 0 && !grades.includes(lecture.grade)) return false;
      if (majors.length > 0 && !majors.includes(lecture.major)) return false;
      if (credits && !lecture.credits.startsWith(String(credits))) return false;
      if (
        days.length > 0 &&
        !lecture.schedules.some((s) => days.includes(s.day))
      )
        return false;
      if (
        times.length > 0 &&
        !lecture.schedules.some((s) =>
          s.range.some((time) => times.includes(time))
        )
      )
        return false;
      return true;
    });
  }, [deferredSearchOptions, lectures]);

  const allMajors = useMemo(
    () => [...new Set(lectures.map((lecture) => lecture.major))],
    [lectures]
  );

 const visibleLectures = useMemo(
  () => filteredLectures.slice(0, page * PAGE_SIZE),
  [filteredLectures, page]
);

  const changeSearchOption = useCallback(
    (field: keyof SearchOption, value: SearchOption[typeof field]) => {
      setPage(1);
      setSearchOptions((prev) => ({ ...prev, [field]: value }));
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    },
    []
  );

  const addSchedule = useCallback(
    (lecture: Lecture) => {
      if (!searchInfoRef.current) return;
      const { tableId } = searchInfoRef.current;
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
    [setSchedulesMap, onClose]
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
    if (!searchInfo) return;
    setSearchOptions((prev) => ({
      ...prev,
      days: searchInfo?.day ? [searchInfo.day] : [],
      times: searchInfo?.time ? [searchInfo.time] : [],
    }));
    setPage(1);
  }, [searchInfo]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      {
        root: scrollRef.current,
        rootMargin: "0px 0px 500px 0px",
        threshold: 0,
      }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [visibleLectures.length, filteredLectures.length]);

  return (
    <Modal isOpen={Boolean(searchInfo)} onClose={onClose} size="6xl" isCentered>
      <ModalOverlay />
      <ModalContent
        maxW="90vw"
        w="1000px"
        h="90vh"
        display="flex"
        flexDirection="column"
      >
        <ModalHeader>수업 검색</ModalHeader>
        <ModalCloseButton />

        <ModalBody
          display="flex"
          flexDirection="column"
          overflow="hidden"
          pb={6}
        >
          <VStack spacing={4} align="stretch" flexShrink={0}>
            <SearchFilter
              searchOptions={searchOptions}
              allMajors={allMajors}
              changeSearchOption={changeSearchOption}
            />
            <Text align="right">검색결과: {filteredLectures.length}개</Text>
          </VStack>

          <Box flex={1} display="flex" flexDirection="column" minH={0} mt={4}>
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

            <Box overflowY="auto" flex={1} ref={scrollRef} position="relative">
              {filteredLectures.length === 0 ? (
                <Flex h="100%" align="center" justify="center" color="gray.500">
                  <Text>검색 결과가 없습니다.</Text>
                </Flex>
              ) : (
                <>
                  <Table size="sm" variant="striped">
                    <Tbody>
                      {visibleLectures.map((lecture, index) => (
                        <LectureRow
                          key={`${lecture.id}-${index}`}
                          lecture={lecture}
                          addSchedule={addSchedule}
                        />
                      ))}
                    </Tbody>
                  </Table>
                  {visibleLectures.length < filteredLectures.length && (
                    <Box ref={loaderRef} h="20px" w="100%" />
                  )}
                </>
              )}
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default memo(SearchDialog);