const DATA_URLS = {
  airQuality: 'https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/data_udara.json',
  waste: 'https://cdn.jsdelivr.net/gh/riyqnn/geojson-data@main/sampah1.json'
};

let cachedData = {
  airQuality: null,
  waste: null
};

const zoonosisData = [
  { kota: "Jakarta Selatan", jumlah_kasus: 288, jumlah_kematian: 1, periode_data: "Maret 2024" },
  { kota: "Jakarta Pusat", jumlah_kasus: 918, jumlah_kematian: 4, periode_data: "Juni 2024" },
  { kota: "Jakarta Barat", jumlah_kasus: 969, jumlah_kematian: 0, periode_data: "Maret 2024" },
  { kota: "Jakarta Timur", jumlah_kasus: 58, jumlah_kematian: 38, periode_data: "Oktober 2024" },
  { kota: "Jakarta Utara", jumlah_kasus: 563, jumlah_kematian: 0, periode_data: "Juni 2023" }
];

const populationData = [
  { kota: "Jakarta Selatan", 2022: 2234262, 2023: 2235606 },
  { kota: "Jakarta Timur", 2022: 3066074, 2023: 3079618 },
  { kota: "Jakarta Pusat", 2022: 1053482, 2023: 1049314 },
  { kota: "Jakarta Barat", 2022: 2458707, 2023: 2470054 },
  { kota: "Jakarta Utara", 2022: 1799220, 2023: 1808985 }
];

const fallbackAirQualityData = [
  { wilayah: "Jakarta Selatan", data_udara_final_max: 55, pm_duakomalima: 45.2, pm_sepuluh: 60.1, ozon: 20.5, nitrogen_dioksida: 15.3, sulfur_dioksida: 10.2, karbon_monoksida: 1.1, data_udara_final_parameter_pencemar_kritis: "PM2.5" },
  { wilayah: "Jakarta Pusat", data_udara_final_max: 65, pm_duakomalima: 50.7, pm_sepuluh: 65.4, ozon: 22.3, nitrogen_dioksida: 18.7, sulfur_dioksida: 12.1, karbon_monoksida: 1.3, data_udara_final_parameter_pencemar_kritis: "PM2.5" },
  { wilayah: "Jakarta Barat", data_udara_final_max: 61, pm_duakomalima: 57.0, pm_sepuluh: 30.0, ozon: 61.0, nitrogen_dioksida: 17.0, sulfur_dioksida: 32.0, karbon_monoksida: 15.0, data_udara_final_parameter_pencemar_kritis: "O3" },
  { wilayah: "Jakarta Timur", data_udara_final_max: 58, pm_duakomalima: 47.3, pm_sepuluh: 61.2, ozon: 20.8, nitrogen_dioksida: 15.9, sulfur_dioksida: 10.5, karbon_monoksida: 1.1, data_udara_final_parameter_pencemar_kritis: "PM2.5" },
  { wilayah: "Jakarta Utara", data_udara_final_max: 60, pm_duakomalima: 46.5, pm_sepuluh: 60.9, ozon: 21.5, nitrogen_dioksida: 16.2, sulfur_dioksida: 10.8, karbon_monoksida: 1.2, data_udara_final_parameter_pencemar_kritis: "PM2.5" }
];

const fallbackWasteData = [
  { wilayah_kota_kab: "Jakarta Selatan", tps_count: 10, organic: 50, plastic: 20, paper: 15, metal: 5, glass: 5, hazardous: 5 },
  { wilayah_kota_kab: "Jakarta Pusat", tps_count: 8, organic: 48, plastic: 22, paper: 14, metal: 6, glass: 5, hazardous: 5 },
  { wilayah_kota_kab: "Jakarta Barat", tps_count: 12, organic: 52, plastic: 18, paper: 16, metal: 5, glass: 4, hazardous: 5 },
  { wilayah_kota_kab: "Jakarta Timur", tps_count: 15, organic: 49, plastic: 21, paper: 15, metal: 5, glass: 5, hazardous: 5 },
  { wilayah_kota_kab: "Jakarta Utara", tps_count: 9, organic: 51, plastic: 19, paper: 14, metal: 6, glass: 5, hazardous: 5 }
];

async function fetchData(url, fallback) {
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(`${url}?_=${Date.now() % 1000}`);
      if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
      const data = await response.json();
      return data.features.length ? data : { features: fallback };
    } catch (error) {
      if (i === 2) {
        console.error(`Error fetching data from ${url} after retries:`, error);
        return { features: fallback };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

function processAirQualityData(features) {
  console.log('Processing air quality data:', features);
  const petaWilayah = new Map();
  features.forEach(f => {
    if (!f.properties || !f.properties.wilayah) return;
    const nama = f.properties.wilayah;
    const ispu = f.properties.data_udara_final_max || 0;
    const kategori = ispu <= 60 ? 'Good' : ispu <= 70 ? 'Moderate' : ispu <= 80 ? 'Unhealthy' : ispu <= 90 ? 'Very Unhealthy' : 'Hazardous';
    petaWilayah.set(nama, {
      id: f.id,
      nama,
      ispu,
      kategori,
      pm10: f.properties.data_udara_final_pm_sepuluh,
      pm25: f.properties.data_udara_final_pm_duakomalima,
      so2: f.properties.data_udara_final_sulfur_dioksida,
      co: f.properties.data_udara_final_karbon_monoksida,
      o3: f.properties.data_udara_final_ozon,
      no2: f.properties.data_udara_final_nitrogen_dioksida,
      parameterKritis: f.properties.data_udara_final_parameter_pencemar_kritis,
      tanggal: f.properties.data_udara_final_tanggal
    });
  });
  return Array.from(petaWilayah.values());
}

function processWasteData(features) {
  console.log('Processing waste data:', features);
  const petaWilayah = new Map();
  features.forEach(f => {
    if (!f.properties || !f.properties.wilayah_kota_kab) return;
    const nama = f.properties.wilayah_kota_kab;
    petaWilayah.set(nama, (petaWilayah.get(nama) || 0) + 1);
  });
  return Array.from(petaWilayah, ([nama, tps_count]) => ({
    wilayah_kota_kab: nama,
    tps_count,
    organic: 50,
    plastic: 20,
    paper: 15,
    metal: 5,
    glass: 5,
    hazardous: 5
  }));
}

export const getChartData = async (tab, selectedRegion, t, data) => {
  console.log('getChartData called with tab:', tab, 'region:', selectedRegion, 'data:', data);
  
  const regionDataKeys = {
    'East Jakarta': 'East Jakarta',
    'North Jakarta': 'North Jakarta',
    'South Jakarta': 'South Jakarta',
    'West Jakarta': 'West Jakarta',
    'Central Jakarta': 'Central Jakarta',
    'Jakarta Timur': 'East Jakarta',
    'Jakarta Utara': 'North Jakarta',
    'Jakarta Selatan': 'South Jakarta',
    'Jakarta Barat': 'West Jakarta',
    'Jakarta Pusat': 'Central Jakarta'
  };

  const tabDataKeys = {
    'SUMMARY': 'SUMMARY',
    'Zoonotic Diseases': 'Zoonotic Diseases',
    'Air Quality Index': 'Air Quality Index',
    'Waste Management': 'Waste Management',
    'RINGKASAN': 'SUMMARY',
    'Penyakit Zoonosis': 'Zoonotic Diseases',
    'Indeks Kualitas Udara': 'Air Quality Index',
    'Pengelolaan Sampah': 'Waste Management'
  };

  const regionToKota = {
    'East Jakarta': 'Jakarta Timur',
    'North Jakarta': 'Jakarta Utara',
    'South Jakarta': 'Jakarta Selatan',
    'West Jakarta': 'Jakarta Barat',
    'Central Jakarta': 'Jakarta Pusat'
  };

  const dataRegion = regionDataKeys[selectedRegion] || 'East Jakarta';
  const dataTab = tabDataKeys[tab] || 'SUMMARY';
  const kota = regionToKota[dataRegion];

  if (!kota) {
    console.warn('No kota mapping for region:', selectedRegion);
    return null;
  }

  const airQualityData = processAirQualityData(data.airQuality?.features || fallbackAirQualityData);
  const wasteData = processWasteData(data.waste?.features || fallbackWasteData);
  console.log('Processed airQualityData:', airQualityData);
  console.log('Processed wasteData:', wasteData);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e5e7eb',
          font: { size: 14, family: 'Inter, sans-serif' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14, family: 'Inter, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, sans-serif' },
        padding: 10,
        cornerRadius: 4
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#e5e7eb', font: { size: 12, family: 'Inter, sans-serif' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#e5e7eb', font: { size: 12, family: 'Inter, sans-serif' } }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  const getZoonosisChartData = () => {
    const regionData = zoonosisData.find(row => row.kota === kota) || {
      jumlah_kasus: 0,
      jumlah_kematian: 0
    };

    const createGradient = (ctx, colorStart, colorEnd) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, colorStart);
      gradient.addColorStop(1, colorEnd);
      return gradient;
    };

    return {
      type: 'bar',
      data: {
        labels: [
          t('tabData.zoonoticDiseases.stats.totalCases'),
          t('tabData.zoonoticDiseases.stats.deaths')
        ],
        datasets: [
          {
            label: selectedRegion,
            data: [regionData.jumlah_kasus, regionData.jumlah_kematian],
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              return context.dataIndex === 0
                ? createGradient(ctx, 'rgba(255, 99, 132, 0.9)', 'rgba(255, 99, 132, 0.3)')
                : createGradient(ctx, 'rgba(255, 159, 64, 0.9)', 'rgba(255, 159, 64, 0.3)');
            },
            borderColor: ['rgb(255, 99, 132)', 'rgb(255, 159, 64)'],
            borderWidth: 1,
            borderRadius: 8,
            barThickness: 40,
            hoverBackgroundColor: (context) => {
              const ctx = context.chart.ctx;
              return context.dataIndex === 0
                ? createGradient(ctx, 'rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.5)')
                : createGradient(ctx, 'rgba(255, 159, 64, 1)', 'rgba(255, 159, 64, 0.5)');
            }
          }
        ]
      },
      options: {
        ...chartOptions,
        indexAxis: 'x',
        scales: {
          ...chartOptions.scales,
          y: {
            ...chartOptions.scales.y,
            beginAtZero: true,
            title: {
              display: true,
              text: t('tabData.zoonoticDiseases.chartYLabel'),
              color: '#e5e7eb',
              font: { size: 14, family: 'Inter, sans-serif' }
            }
          },
          x: {
            ...chartOptions.scales.x,
            title: {
              display: true,
              text: t('tabData.zoonoticDiseases.chartXLabel'),
              color: '#e5e7eb',
              font: { size: 14, family: 'Inter, sans-serif' }
            }
          }
        },
        plugins: {
          ...chartOptions.plugins,
          legend: { display: false },
          tooltip: {
            ...chartOptions.plugins.tooltip,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.raw}`
            }
          }
        },
        elements: {
          bar: {
            borderSkipped: false
          }
        }
      }
    };
  };

  const getAirQualityChartData = () => {
    const airData = airQualityData.find(f => f.nama === kota) || {
      pm25: 0,
      pm10: 0,
      o3: 0,
      no2: 0,
      so2: 0,
      co: 0
    };

    return {
      type: 'bar',
      data: {
        labels: [
          t('chart.labels.airQuality.pm25'),
          t('chart.labels.airQuality.pm10'),
          t('chart.labels.airQuality.ozone'),
          t('chart.labels.airQuality.no2'),
          t('chart.labels.airQuality.so2'),
          t('chart.labels.airQuality.co')
        ],
        datasets: [
          {
            label: selectedRegion,
            data: [
              airData.pm25,
              airData.pm10,
              airData.o3,
              airData.no2,
              airData.so2,
              airData.co
            ],
            backgroundColor: [
              getAQIColor(airData.pm25),
              getAQIColor(airData.pm10),
              getAQIColor(airData.o3),
              getAQIColor(airData.no2),
              getAQIColor(airData.so2),
              getAQIColor(airData.co)
            ],
            borderWidth: 1
          },
          {
            label: t('chart.labels.airQuality.whoStandards'),
            data: [10, 20, 50, 25, 40, 4],
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.6)',
            borderWidth: 2,
            borderDash: [5, 5],
            type: 'line'
          }
        ]
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          y: {
            ...chartOptions.scales.y,
            beginAtZero: true,
            title: {
              display: true,
              text: t('tabData.airQualityIndex.chartYLabel'),
              color: '#e5e7eb',
              font: { size: 14, family: 'Inter, sans-serif' }
            }
          }
        }
      }
    };
  };

  const getWasteChartData = () => {
    console.log('getWasteChartData called, wasteData:', wasteData);
    const waste = wasteData?.find(f => f.wilayah_kota_kab === kota) || {
      organic: 50,
      plastic: 20,
      paper: 15,
      metal: 5,
      glass: 5,
      hazardous: 5
    };

    return {
      type: 'polarArea',
      data: {
        labels: [
          t('tabData.wasteManagement.stats.organic'),
          t('tabData.wasteManagement.stats.plastic'),
          t('tabData.wasteManagement.stats.paper'),
          t('tabData.wasteManagement.stats.metal'),
          t('tabData.wasteManagement.stats.glass'),
          t('tabData.wasteManagement.stats.hazardous')
        ],
        datasets: [
          {
            label: t('tabData.wasteManagement.chartTitle'),
            data: [
              waste.organic,
              waste.plastic,
              waste.paper,
              waste.metal,
              waste.glass,
              waste.hazardous
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.7)',
              'rgba(255, 99, 132, 0.7)',
              'rgba(255, 205, 86, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(153, 102, 255, .7)',
              'rgba(255, 159, 64, 0.7)'
            ]
          }
        ]
      },
      options: {
        ...chartOptions,
        plugins: {
          ...chartOptions.plugins,
          legend: {
            position: 'right',
            labels: {
              color: '#e5e7eb',
              font: { size: 12, family: 'Inter, sans-serif' }
            }
          }
        }
      }
    };
  };

  const getSummaryChartData = () => {
    let zoonosisScore = 0, airScore = 0, wasteScore = 0, populationScore = 0;
    
    const zoonosis = zoonosisData.find(row => row.kota === kota);
    if (zoonosis) {
      zoonosisScore = zoonosis.jumlah_kasus
        ? Math.min(100, 100 - (zoonosis.jumlah_kasus / 1000) * 100)
        : 80;
    }

    const airQuality = airQualityData.find(f => f.nama === kota);
    if (airQuality) {
      airScore = airQuality.ispu
        ? Math.min(100, 100 - (airQuality.ispu / 100) * 100)
        : 75;
    }

    const waste = wasteData?.find(f => f.wilayah_kota_kab === kota);
    if (waste) {
      wasteScore = waste.tps_count
        ? Math.min(100, (waste.tps_count / 20) * 100)
        : 70;
    }

    const population = populationData.find(row => row.kota === kota);
    if (population) {
      populationScore = population[2023]
        ? Math.min(100, (population[2023] / 4000000) * 100)
        : 60;
    }

    return {
      type: 'radar',
      data: {
        labels: [
          t('tabData.summary.stats.diseaseIncidents'),
          t('tabData.summary.stats.airQualityIndex'),
          t('tabData.summary.stats.wasteLocations'),
          t('tabData.summary.stats.population')
        ],
        datasets: [
          {
            label: selectedRegion,
            data: [
              zoonosisScore,
              airScore,
              wasteScore,
              populationScore
            ],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgb(54, 162, 235)',
            pointBackgroundColor: 'rgb(54, 162, 235)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(54, 162, 235)'
          },
          {
            label: t('chart.labels.summary.jakartaAverage'),
            data: [65, 59, 70, 62],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            pointBackgroundColor: 'rgb(255, 99, 132)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(255, 99, 132)'
          }
        ]
      },
      options: {
        ...chartOptions,
        elements: {
          line: {
            borderWidth: 3
          }
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#e5e7eb', font: { size: 12, family: 'Inter, sans-serif' } }
          }
        }
      }
    };
  };

  function getAQIColor(value) {
    if (value <= 50) return 'rgba(0, 228, 0, 0.7)';
    if (value <= 100) return 'rgba(255, 255, 0, 0.7)';
    if (value <= 150) return 'rgba(255, 126, 0, 0.7)';
    if (value <= 200) return 'rgba(255, 0, 0, 0.7)';
    if (value <= 300) return 'rgba(143, 63, 151, 0.7)';
    return 'rgba(126, 0, 35, 0.7)';
  }

  const chartFunctions = {
    'SUMMARY': getSummaryChartData,
    'Zoonotic Diseases': getZoonosisChartData,
    'Air Quality Index': getAirQualityChartData,
    'Waste Management': getWasteChartData
  };

  const chartFunc = chartFunctions[dataTab] || chartFunctions['SUMMARY'];
  return chartFunc();
};