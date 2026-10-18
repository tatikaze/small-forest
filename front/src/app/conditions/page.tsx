"use client";
import { useState, type FormEvent } from "react";
import { Box, Button, Flex, Input, Text, chakra } from "@chakra-ui/react";
import { formatInTimeZone } from "date-fns-tz";
import { isAxiosError } from "axios";
import { useDeviceCondition, type ConditionPeriod } from "~/hooks/device_condition";
import { parseConditionDate, PRESETS, rangeError } from "~/lib/condition-range";
import { Title } from "~/components/Title";
import { ConditionGraph } from "~/components/ConditionGraph";

const tokyoInput = (date: number) => formatInTimeZone(date, "Asia/Tokyo", "yyyy-MM-dd'T'HH:mm");
const displayDate = (date: string) => formatInTimeZone(date, "Asia/Tokyo", "yyyy/MM/dd HH:mm");

export default function ConditionDetailPage() {
  const [period, setPeriod] = useState<ConditionPeriod>({ hours: 2 });
  const [custom, setCustom] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const { conditions, loading, error, range, mutate, revalidating } = useDeviceCondition(period, false);
  const errorMessage = isAxiosError<{ message: string }>(error)
    ? error.response?.data?.message ?? "データを取得できませんでした。"
    : "データを取得できませんでした。";

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const startValue = String(fields.get("start"));
    const endValue = String(fields.get("end"));
    setStart(startValue);
    setEnd(endValue);
    const startTime = parseConditionDate(startValue);
    const endTime = parseConditionDate(endValue);
    const message = rangeError(startTime, endTime);
    setValidation(message);
    if (!message) setPeriod({ start: new Date(startTime).toISOString(), end: new Date(endTime).toISOString() });
  }

  return (
    <Flex flexDir="column" alignItems="center" px={4} py={8}>
      <Title />
      <Box w="full" maxW="1000px" mt={8}>
        <Text as="h2" fontSize="2xl" fontWeight="bold" mb={2}>温湿度の履歴</Text>
        <Text color="gray.600" mb={4}>日本時間（JST）で表示しています。1回に指定できる期間は最大31日です。</Text>
        <Flex gap={2} flexWrap="wrap" role="group" aria-label="表示期間">
          {PRESETS.map(preset => (
            <Button key={preset.hours} variant={!custom && "hours" in period && period.hours === preset.hours ? "solid" : "outline"}
              aria-pressed={!custom && "hours" in period && period.hours === preset.hours}
              onClick={() => { setCustom(false); setValidation(null); setPeriod({ hours: preset.hours }); }}>
              直近{preset.label}
            </Button>
          ))}
          <Button variant={custom ? "solid" : "outline"} aria-pressed={custom} onClick={() => {
            setCustom(true);
            if (!start) {
              const now = Date.now();
              setStart(tokyoInput(range ? Date.parse(range.start_date) : now - 7_200_000));
              setEnd(tokyoInput(range ? Date.parse(range.end_date) : now));
            }
          }}>期間を指定</Button>
        </Flex>
        {custom && (
          <chakra.form onSubmit={apply} mt={4} p={4} borderWidth="1px" borderRadius="md">
            <Flex gap={4} flexWrap="wrap" alignItems="flex-end">
              <Box flex="1" minW="220px">
                <label htmlFor="condition-start">開始日時（JST）</label>
                <Input id="condition-start" name="start" type="datetime-local" required defaultValue={start} aria-describedby="period-help period-error" aria-invalid={!!validation} />
              </Box>
              <Box flex="1" minW="220px">
                <label htmlFor="condition-end">終了日時（JST）</label>
                <Input id="condition-end" name="end" type="datetime-local" required defaultValue={end} aria-describedby="period-help period-error" aria-invalid={!!validation} />
              </Box>
              <Button type="submit">この期間を表示</Button>
            </Flex>
            <Text id="period-help" fontSize="sm" color="gray.600" mt={2}>入力後に「この期間を表示」を押すと反映します。</Text>
            <Text id="period-error" role={validation ? "alert" : undefined} color="red.600" mt={2}>{validation}</Text>
          </chakra.form>
        )}
        <Flex my={4} gap={3} justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Box aria-live="polite">
            {range && <Text>{displayDate(range.start_date)} 〜 {displayDate(range.end_date)}</Text>}
            <Text fontSize="sm" color="gray.600">
              {range ? (range.interval_minutes ? `${range.interval_minutes}分ごとの平均値` : "計測値") : ""}
              {"hours" in period ? " · 5分ごとに自動更新" : " · 指定期間の自動更新は停止中"}
            </Text>
          </Box>
          <Button variant="outline" size="sm" onClick={() => void mutate()} disabled={loading || revalidating}>
            {revalidating ? "更新中…" : "再読み込み"}
          </Button>
        </Flex>
        {error && <Text role="alert" color="red.600" mb={4}>{errorMessage}{conditions ? " 最後に取得できたデータを表示しています。" : ""}</Text>}
        {loading && <Text role="status" py={12} textAlign="center">データを読み込んでいます…</Text>}
        {!loading && conditions && <Box h={{ base: "320px", md: "440px" }}><ConditionGraph conditions={conditions} title="温湿度の推移" /></Box>}
      </Box>
    </Flex>
  );
}
