import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  memo,
  useDeferredValue,
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
  Table,
  Tag,
  TagCloseButton,
  TagLabel,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Wrap,
} from "@chakra-ui/react";

import { useScheduleContext } from "./ScheduleContext.tsx";

import { Lecture, LectureWithSchedule } from "./types.ts";

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

const PAGE_SIZE = 100;

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

// --- 하위 컴포넌트들 (변경 없음) ---

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
      (e: React.ChangeEvent<HTMLInputElement>) => {
        changeSearchOption("query", e.target.value);
      },
      [changeSearchOption]
    );

    const handleChangeCredits = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        changeSearchOption("credits", e.target.value);
      },
      [changeSearchOption]
    );

    const handleChangeGrades = useCallback(
      (v: number[]) => {
        changeSearchOption("grades", v);
      },
      [changeSearchOption]
    );

    const handleChangeDays = useCallback(
      (v: string[]) => {
        changeSearchOption("days", v);
      },
      [changeSearchOption]
    );

    const handleChangeTimes = useCallback(
      (v: number[]) => {
        changeSearchOption("times", v);
      },
      [changeSearchOption]
    );

    const handleChangeMajors = useCallback(
      (v: string[]) => {
        changeSearchOption("majors", v);
      },
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
    lecture: Lecture;
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

  const [loaderWrapper, setLoaderWrapper] = useState<HTMLDivElement | null>(
    null
  );
  const [loader, setLoader] = useState<HTMLDivElement | null>(null);

  // [수정] state 타입을 LectureWithSchedule[]로 변경
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
          // 👇 매번 toLowerCase() 호출하던 것을 제거하고, 미리 만든 필드 사용
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
      .filter((lecture) => {
        if (days.length === 0) {
          return true;
        }
        // [최적화] 매번 파싱하지 않고, 미리 파싱된 schedules 사용
        return lecture.schedules.some((s) => days.includes(s.day));
      })
      .filter((lecture) => {
        if (times.length === 0) {
          return true;
        }
        // [최적화] 매번 파싱하지 않고, 미리 파싱된 schedules 사용
        return lecture.schedules.some((s) =>
          s.range.some((time) => times.includes(time))
        );
      });
  }, [deferredSearchOptions, lectures]);

  const lastPage = Math.ceil(filteredLectures.length / PAGE_SIZE);
  const visibleLectures = filteredLectures.slice(0, page * PAGE_SIZE);

  const allMajors = useMemo(
    () => [...new Set(lectures.map((lecture) => lecture.major))],
    [lectures]
  );

  const changeSearchOption = useCallback(
    (field: keyof SearchOption, value: SearchOption[typeof field]) => {
      setPage(1);
      setSearchOptions((prev) => ({ ...prev, [field]: value }));
      loaderWrapper?.scrollTo(0, 0);
    },
    [loaderWrapper]
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
    if (!searchInfo || lectures.length > 0) {
      return;
    }

    const start = performance.now();
    console.log("API 호출 시작: ", start);
    fetchAllLectures().then((results) => {
      const end = performance.now();
      console.log("모든 API 호출 완료 ", end);
      console.log("API 호출에 걸린 시간(ms): ", end - start);

      // [최적화] 데이터 수신 직후 파싱 수행 (O(N))
      // 필터링 시에는 파싱된 데이터를 사용하여 연산 비용 제거
      setLectures(
        results.flatMap((result) =>
          result.data.map((lecture) => ({
            ...lecture,
            schedules: lecture.schedule ? parseSchedule(lecture.schedule) : [],
            // 검색용 문자열 미리 변환 (Pre-lowercasing)
            titleLower: lecture.title.toLowerCase(),
            idLower: lecture.id.toLowerCase(),
          }))
        )
      );
    });
  }, [searchInfo]);

  useEffect(() => {
    if (!loader || !loaderWrapper) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => Math.min(lastPage, prevPage + 1));
        }
      },
      {
        threshold: 0,
        root: loaderWrapper,
        rootMargin: "0px 0px 1000px 0px",
      }
    );

    observer.observe(loader);

    return () => observer.unobserve(loader);
  }, [loader, loaderWrapper, lastPage]);

  useEffect(() => {
    setSearchOptions((prev) => ({
      ...prev,
      days: searchInfo?.day ? [searchInfo.day] : [],
      times: searchInfo?.time ? [searchInfo.time] : [],
    }));
    setPage(1);
  }, [searchInfo]);

  return (
    <Modal isOpen={Boolean(searchInfo)} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxW="90vw" w="1000px">
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

              <Box overflowY="auto" maxH="500px" ref={setLoaderWrapper}>
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
                <Box ref={setLoader} h="20px" />
              </Box>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SearchDialog;
