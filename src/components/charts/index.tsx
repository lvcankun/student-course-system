import { memo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface ChartProps {
  data: { name: string; value: number }[];
  title?: string;
  height?: number;
}

export const PieChart = memo(({ data, title, height = 300 }: ChartProps) => {
  const option: EChartsOption = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: data.map(item => ({ name: item.name, value: item.value })),
    }],
    color: ['#1890ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#fa8c16'],
  };

  return <ReactECharts option={option} style={{ height }} />;
});

export const BarChart = memo(({ data, title, height = 300 }: ChartProps) => {
  const option: EChartsOption = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(item => item.name), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: data.map(item => item.value),
      itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] },
    }],
  };

  return <ReactECharts option={option} style={{ height }} />;
});

export const LineChart = memo(({ data, title, height = 300 }: ChartProps) => {
  const option: EChartsOption = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: data.map(item => item.name) },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      data: data.map(item => item.value),
      smooth: true,
      areaStyle: { color: 'rgba(24, 144, 255, 0.2)' },
      lineStyle: { color: '#1890ff' },
      itemStyle: { color: '#1890ff' },
    }],
  };

  return <ReactECharts option={option} style={{ height }} />;
});

PieChart.displayName = 'PieChart';
BarChart.displayName = 'BarChart';
LineChart.displayName = 'LineChart';
