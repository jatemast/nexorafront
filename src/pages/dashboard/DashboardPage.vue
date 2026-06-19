<script setup>
// Plantilla estática del Dashboard (Light & Dark Mode)
</script>

<template>
  <div class="dashboard-page space-y-6 pb-10 relative z-0">
    <!-- =================================================================== -->
    <!-- HEADER                                                              -->
    <!-- =================================================================== -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">¡Bienvenido, Carlos!</h1>
        <p class="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Resumen general de aprendizaje de tu organización.</p>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ROW 1: 4 KPI CARDS                                                  -->
    <!-- =================================================================== -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 relative z-0">
      <!-- Card 1 -->
      <div class="bg-white dark:bg-[#151f32] rounded-2xl p-6 border border-gray-100 dark:border-slate-700/50 shadow-sm dark:shadow-none hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-users text-2xl text-blue-500 dark:text-blue-400"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Usuarios Activos</span>
            <span class="text-[28px] font-bold text-gray-900 dark:text-white mb-2 leading-none">1,248</span>
            <span class="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
              <i class="pi pi-arrow-up text-[9px]"></i> 12.4% <span class="text-gray-400 dark:text-gray-500 font-medium">vs.</span>
            </span>
          </div>
        </div>
      </div>
      <!-- Card 2 -->
      <div class="bg-white dark:bg-[#151f32] rounded-2xl p-6 border border-gray-100 dark:border-slate-700/50 shadow-sm dark:shadow-none hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-verified text-2xl text-emerald-500 dark:text-emerald-400"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Cumplimiento General</span>
            <span class="text-[28px] font-bold text-gray-900 dark:text-white mb-2 leading-none">76%</span>
            <span class="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
              <i class="pi pi-arrow-up text-[9px]"></i> 8.3% <span class="text-gray-400 dark:text-gray-500 font-medium">vs.</span>
            </span>
          </div>
        </div>
      </div>
      <!-- Card 3 -->
      <div class="bg-white dark:bg-[#151f32] rounded-2xl p-6 border border-gray-100 dark:border-slate-700/50 shadow-sm dark:shadow-none hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-shield text-2xl text-blue-500 dark:text-blue-400"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Cursos Completados</span>
            <span class="text-[28px] font-bold text-gray-900 dark:text-white mb-2 leading-none">342</span>
            <span class="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
              <i class="pi pi-arrow-up text-[9px]"></i> 15.7% <span class="text-gray-400 dark:text-gray-500 font-medium">vs.</span>
            </span>
          </div>
        </div>
      </div>
      <!-- Card 4 -->
      <div class="bg-white dark:bg-[#151f32] rounded-2xl p-6 border border-gray-100 dark:border-slate-700/50 shadow-sm dark:shadow-none hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-eye-slash text-2xl text-red-500 dark:text-red-400"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Puntos Ciegos</span>
            <span class="text-[28px] font-bold text-gray-900 dark:text-white mb-2 leading-none">32</span>
            <span class="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1">
              <i class="pi pi-arrow-up text-[9px]"></i> 5.2% <span class="text-gray-400 dark:text-gray-500 font-medium">vs.</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ROW 2: Horizontal Bars & Donut Chart                                -->
    <!-- =================================================================== -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-0">
      
      <!-- Brechas de Conocimiento -->
      <div class="lg:col-span-2 bg-white dark:bg-[#151f32] rounded-2xl p-7 border border-gray-100 dark:border-slate-700/50 shadow-sm dark:shadow-none group transition-all duration-300">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Brechas de Conocimiento</h2>
            <i class="pi pi-info-circle text-gray-400 dark:text-gray-500 text-sm cursor-pointer hover:text-blue-500 transition-colors"></i>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Item 1 -->
          <div class="flex items-center gap-4">
            <div class="w-44 text-[13px] font-semibold text-gray-700 dark:text-gray-300">Uso de Arnés</div>
            <div class="flex-1 relative h-4">
              <div class="absolute inset-y-0 left-0 w-[89%] border border-dashed border-gray-300 dark:border-gray-500 rounded-r"></div>
              <div class="absolute inset-y-0 left-0 w-[89%] bg-emerald-500 dark:bg-emerald-400 rounded-r shadow-sm"></div>
            </div>
            <div class="w-10 text-right text-[13px] font-bold text-emerald-600 dark:text-emerald-400">89%</div>
          </div>
          <!-- Item 2 -->
          <div class="flex items-center gap-4">
            <div class="w-44 text-[13px] font-semibold text-gray-700 dark:text-gray-300">Trabajo en Altura</div>
            <div class="flex-1 relative h-4">
              <div class="absolute inset-y-0 left-0 w-[85%] border border-dashed border-gray-300 dark:border-gray-500 rounded-r"></div>
              <div class="absolute inset-y-0 left-0 w-[65%] bg-blue-500 dark:bg-blue-400 rounded-r shadow-sm"></div>
            </div>
            <div class="w-10 text-right text-[13px] font-bold text-gray-900 dark:text-white">65%</div>
          </div>
          <!-- Item 3 -->
          <div class="flex items-center gap-4">
            <div class="w-44 text-[13px] font-semibold text-gray-700 dark:text-gray-300">Espacios Confinados</div>
            <div class="flex-1 relative h-4">
              <div class="absolute inset-y-0 left-0 w-[60%] border border-dashed border-gray-300 dark:border-gray-500 rounded-r"></div>
              <div class="absolute inset-y-0 left-0 w-[32%] bg-red-500 dark:bg-red-400 rounded-r shadow-sm"></div>
            </div>
            <div class="w-10 text-right text-[13px] font-bold text-gray-900 dark:text-white">32%</div>
          </div>
          <!-- Item 4 -->
          <div class="flex items-center gap-4">
            <div class="w-44 text-[13px] font-semibold text-gray-700 dark:text-gray-300">Primeros Auxilios</div>
            <div class="flex-1 relative h-4">
              <div class="absolute inset-y-0 left-0 w-[90%] border border-dashed border-gray-300 dark:border-gray-500 rounded-r"></div>
              <div class="absolute inset-y-0 left-0 w-[74%] bg-blue-500 dark:bg-blue-400 rounded-r shadow-sm"></div>
            </div>
            <div class="w-10 text-right text-[13px] font-bold text-gray-900 dark:text-white">74%</div>
          </div>
          <!-- Item 5 -->
          <div class="flex items-center gap-4">
            <div class="w-44 text-[13px] font-semibold text-gray-700 dark:text-gray-300">Manejo de Herramientas</div>
            <div class="flex-1 relative h-4">
              <div class="absolute inset-y-0 left-0 w-[75%] border border-dashed border-gray-300 dark:border-gray-500 rounded-r"></div>
              <div class="absolute inset-y-0 left-0 w-[60%] bg-blue-500 dark:bg-blue-400 rounded-r shadow-sm"></div>
            </div>
            <div class="w-10 text-right text-[13px] font-bold text-gray-900 dark:text-white">60%</div>
          </div>
        </div>

        <div class="mt-8 flex items-center justify-center gap-8 text-[12px] pt-4 border-t border-gray-50 dark:border-slate-800/50">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-[2px]"></div>
            <span class="text-gray-500 dark:text-gray-400 font-medium">Nivel Actual</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 border border-dashed border-gray-400 dark:border-gray-500 rounded-[2px]"></div>
            <span class="text-gray-500 dark:text-gray-400 font-medium">Nivel Objetivo</span>
          </div>
        </div>
      </div>

      <!-- Puntos Ciegos Críticos -->
      <div class="bg-white dark:bg-[#151f32] rounded-2xl p-7 border border-gray-100 dark:border-slate-700/50 shadow-sm dark:shadow-none flex flex-col group transition-all duration-300">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Puntos Ciegos Críticos</h2>
            <i class="pi pi-info-circle text-gray-400 dark:text-gray-500 text-sm cursor-pointer hover:text-red-500 transition-colors"></i>
          </div>
        </div>

        <div class="flex items-center gap-6 mb-8 justify-center">
          <div class="relative w-24 h-24">
            <!-- Circulo de fondo según tema -->
            <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90 relative z-0">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" class="stroke-gray-100 dark:stroke-slate-800" stroke-width="4" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" class="stroke-red-500 dark:stroke-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]" stroke-width="4" stroke-dasharray="32, 100" />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-[22px] font-bold text-gray-900 dark:text-white">32%</span>
            </div>
          </div>
          <div>
            <p class="text-[12px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">Total Identificados</p>
            <p class="text-[32px] font-bold text-gray-900 dark:text-white leading-none">32</p>
          </div>
        </div>

        <div class="space-y-4 mb-auto">
          <div class="flex justify-between items-center text-[13px] group/item hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1.5 -mx-1.5 rounded transition-colors">
            <span class="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400"></div>Espacios Confinados</span>
            <span class="font-bold text-blue-600 dark:text-blue-400">32%</span>
          </div>
          <div class="w-full h-px bg-gray-100 dark:bg-slate-700/50"></div>
          <div class="flex justify-between items-center text-[13px] group/item hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1.5 -mx-1.5 rounded transition-colors">
            <span class="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></div>Bloqueo y Etiquetado</span>
            <span class="font-bold text-blue-600 dark:text-blue-400">28%</span>
          </div>
          <div class="w-full h-px bg-gray-100 dark:bg-slate-700/50"></div>
          <div class="flex justify-between items-center text-[13px] group/item hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1.5 -mx-1.5 rounded transition-colors">
            <span class="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></div>Izaje de Cargas</span>
            <span class="font-bold text-blue-600 dark:text-blue-400">24%</span>
          </div>
        </div>

        <div class="text-right mt-6 relative z-0">
          <a href="#" class="text-blue-600 dark:text-blue-400 font-semibold text-[13px] hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors">Ver todos los puntos ciegos</a>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ROW 3: Vertical Bars, Line Chart, List                              -->
    <!-- =================================================================== -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-0">
      
      <!-- Cumplimiento por Área -->
      <div class="bg-white dark:bg-[#151f32] rounded-2xl p-7 border border-gray-100 dark:border-slate-700/50 shadow-sm dark:shadow-none">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Cumplimiento por Área</h2>
          <i class="pi pi-info-circle text-gray-400 dark:text-gray-500 text-sm"></i>
        </div>

        <div class="h-44 flex items-end justify-between gap-3 relative z-0">
          <!-- Op -->
          <div class="flex flex-col items-center flex-1 h-full">
            <div class="w-full relative flex items-end justify-center h-full group">
              <div class="absolute bottom-0 w-8 border border-dashed border-gray-200 dark:border-slate-600 rounded-t h-full"></div>
              <div class="w-8 bg-blue-500 dark:bg-blue-500/80 rounded-t group-hover:bg-blue-600 dark:group-hover:bg-blue-400 transition-colors cursor-pointer relative" style="height: 82%">
                <div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold py-1 px-2 rounded shadow-md transition-opacity">82%</div>
              </div>
            </div>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-3 truncate w-full text-center" title="Operaciones">Operaciones</span>
          </div>
          <!-- Mant -->
          <div class="flex flex-col items-center flex-1 h-full">
            <div class="w-full relative flex items-end justify-center h-full group">
              <div class="absolute bottom-0 w-8 border border-dashed border-gray-200 dark:border-slate-600 rounded-t" style="height: 90%"></div>
              <div class="w-8 bg-blue-400 dark:bg-blue-500/60 rounded-t group-hover:bg-blue-600 dark:group-hover:bg-blue-400 transition-colors cursor-pointer relative" style="height: 74%">
                <div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold py-1 px-2 rounded shadow-md transition-opacity">74%</div>
              </div>
            </div>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-3 truncate w-full text-center" title="Mantenimiento">Mantenimiento</span>
          </div>
          <!-- Log -->
          <div class="flex flex-col items-center flex-1 h-full">
            <div class="w-full relative flex items-end justify-center h-full group">
              <div class="absolute bottom-0 w-8 border border-dashed border-gray-200 dark:border-slate-600 rounded-t" style="height: 85%"></div>
              <div class="w-8 bg-blue-400 dark:bg-blue-500/60 rounded-t group-hover:bg-blue-600 dark:group-hover:bg-blue-400 transition-colors cursor-pointer relative" style="height: 68%">
                <div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold py-1 px-2 rounded shadow-md transition-opacity">68%</div>
              </div>
            </div>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-3 truncate w-full text-center" title="Logística">Logística</span>
          </div>
          <!-- Admin -->
          <div class="flex flex-col items-center flex-1 h-full">
            <div class="w-full relative flex items-end justify-center h-full group">
              <div class="absolute bottom-0 w-8 border border-dashed border-gray-200 dark:border-slate-600 rounded-t" style="height: 80%"></div>
              <div class="w-8 bg-blue-300 dark:bg-blue-500/40 rounded-t group-hover:bg-blue-600 dark:group-hover:bg-blue-400 transition-colors cursor-pointer relative" style="height: 52%">
                <div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold py-1 px-2 rounded shadow-md transition-opacity">52%</div>
              </div>
            </div>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-3 truncate w-full text-center" title="Administrativa">Administrativa</span>
          </div>
          <!-- HSEQ -->
          <div class="flex flex-col items-center flex-1 h-full">
            <div class="w-full relative flex items-end justify-center h-full group">
              <div class="absolute bottom-0 w-8 border border-dashed border-gray-200 dark:border-slate-600 rounded-t" style="height: 95%"></div>
              <div class="w-8 bg-blue-600 dark:bg-blue-400 rounded-t group-hover:bg-blue-700 dark:group-hover:bg-blue-300 transition-colors cursor-pointer relative" style="height: 90%">
                <div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold py-1 px-2 rounded shadow-md transition-opacity">90%</div>
              </div>
            </div>
            <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-3 truncate w-full text-center" title="HSEQ">HSEQ</span>
          </div>
        </div>
      </div>

      <!-- Tendencia de Aprendizaje -->
      <div class="bg-white dark:bg-[#151f32] rounded-2xl p-7 border border-gray-100 dark:border-slate-700/50 shadow-sm dark:shadow-none">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-6">Tendencia de Aprendizaje</h2>
        <div class="relative h-44 w-full z-0">
          <!-- Y Axis Labels -->
          <div class="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
          <!-- Chart Area -->
          <div class="absolute left-8 right-0 top-0 bottom-6">
            <!-- Grid -->
            <div class="w-full h-full flex flex-col justify-between">
              <div class="w-full h-px bg-gray-100 dark:bg-slate-700/50"></div>
              <div class="w-full h-px bg-gray-100 dark:bg-slate-700/50"></div>
              <div class="w-full h-px bg-gray-100 dark:bg-slate-700/50"></div>
              <div class="w-full h-px bg-gray-100 dark:bg-slate-700/50"></div>
              <div class="w-full h-px bg-gray-100 dark:bg-slate-700/50"></div>
            </div>
            <!-- Line SVG -->
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0 w-full h-full overflow-visible z-0">
              <defs>
                <linearGradient id="trendGradMode" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 85 L 10 70 C 15 65, 20 70, 25 75 C 35 85, 35 50, 45 60 C 55 70, 55 45, 65 55 C 75 65, 80 40, 85 30 C 90 20, 95 15, 100 10 L 100 100 L 0 100 Z" fill="url(#trendGradMode)" />
              <path d="M 0 85 L 10 70 C 15 65, 20 70, 25 75 C 35 85, 35 50, 45 60 C 55 70, 55 45, 65 55 C 75 65, 80 40, 85 30 C 90 20, 95 15, 100 10" fill="none" class="stroke-blue-500 dark:stroke-blue-400" stroke-width="2.5" stroke-linecap="round" />
              <!-- Dots -->
              <circle cx="10" cy="70" r="3" class="fill-blue-500 dark:fill-blue-400 stroke-white dark:stroke-[#151f32]" stroke-width="2" />
              <circle cx="25" cy="75" r="3" class="fill-blue-500 dark:fill-blue-400 stroke-white dark:stroke-[#151f32]" stroke-width="2" />
              <circle cx="45" cy="60" r="3" class="fill-blue-500 dark:fill-blue-400 stroke-white dark:stroke-[#151f32]" stroke-width="2" />
              <circle cx="65" cy="55" r="3" class="fill-blue-500 dark:fill-blue-400 stroke-white dark:stroke-[#151f32]" stroke-width="2" />
              <circle cx="85" cy="30" r="3" class="fill-blue-500 dark:fill-blue-400 stroke-white dark:stroke-[#151f32]" stroke-width="2" />
              <circle cx="100" cy="10" r="3" class="fill-blue-500 dark:fill-blue-400 stroke-white dark:stroke-[#151f32]" stroke-width="2" />
            </svg>
          </div>
          <!-- X Axis Labels -->
          <div class="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-gray-500 dark:text-gray-400 font-medium pt-2">
            <span>Ene</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Abr</span>
            <span>May</span>
          </div>
        </div>
      </div>

      <!-- Recomendaciones IA -->
      <div class="bg-white dark:bg-[#151f32] rounded-2xl p-7 border border-gray-100 dark:border-slate-700/50 shadow-sm dark:shadow-none flex flex-col relative z-0">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Recomendaciones IA</h2>
            <i class="pi pi-sparkles text-blue-500 dark:text-blue-400 text-[14px]"></i>
          </div>
        </div>

        <div class="space-y-6 flex-1">
          <!-- Item 1 -->
          <div class="flex items-start gap-4 p-2 -m-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
            <div class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i class="pi pi-exclamation-triangle text-red-500 dark:text-red-400"></i>
            </div>
            <div>
              <p class="text-[13px] font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-1">Reforzar capacitación en Espacios Confinados</p>
              <p class="text-[11px] font-bold text-red-500 dark:text-red-400 tracking-wide uppercase">Alta prioridad</p>
            </div>
          </div>
          <!-- Item 2 -->
          <div class="flex items-start gap-4 p-2 -m-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
            <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i class="pi pi-calendar text-blue-500 dark:text-blue-400"></i>
            </div>
            <div>
              <p class="text-[13px] font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-1">Programar reentrenamiento de trabajo en altura</p>
              <p class="text-[11px] font-bold text-yellow-600 dark:text-yellow-500 tracking-wide uppercase">Media prioridad</p>
            </div>
          </div>
          <!-- Item 3 -->
          <div class="flex items-start gap-4 p-2 -m-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
            <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i class="pi pi-check-circle text-emerald-500 dark:text-emerald-400"></i>
            </div>
            <div>
              <p class="text-[13px] font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-1">Seguir promoviendo el uso correcto del arnés</p>
              <p class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">Baja prioridad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
