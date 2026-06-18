import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ---------------------------------------------------------------------------
// Lazy-loaded route components (created in later subtasks)
// ---------------------------------------------------------------------------
const Login = () => import('@/pages/auth/LoginPage.vue')
const Register = () => import('@/pages/auth/RegisterPage.vue')
const ForgotPassword = () => import('@/pages/auth/ForgotPasswordPage.vue')
const ResetPassword = () => import('@/pages/auth/ResetPasswordPage.vue')

const AppLayout = () => import('@/layouts/AppLayout.vue')
const Dashboard = () => import('@/views/dashboard/Dashboard.vue')
const Profile = () => import('@/pages/ProfilePage.vue')

const Employees = () => import('@/views/employees/Employees.vue')
const EmployeeCreate = () => import('@/views/employees/EmployeeCreate.vue')
const EmployeeEdit = () => import('@/views/employees/EmployeeEdit.vue')

const Courses = () => import('@/views/courses/Courses.vue')
const CourseCreate = () => import('@/views/courses/CourseCreate.vue')
const CourseDetail = () => import('@/views/courses/CourseDetail.vue')
const CourseEdit = () => import('@/views/courses/CourseEdit.vue')
const CourseCategories = () => import('@/views/courses/CourseCategories.vue')

const Microlearning = () => import('@/views/microlearning/Microlearning.vue')
const MicrolearningCreate = () => import('@/views/microlearning/MicrolearningCreate.vue')
const MicrolearningAssign = () => import('@/views/microlearning/MicrolearningAssign.vue')

const Questions = () => import('@/views/questions/Questions.vue')
const QuestionCreate = () => import('@/views/questions/QuestionCreate.vue')
const QuestionEdit = () => import('@/views/questions/QuestionEdit.vue')
const QuestionCategories = () => import('@/views/questions/QuestionCategories.vue')

const Evaluations = () => import('@/pages/evaluations/EvaluationsIndex.vue')
const EvaluationCreate = () => import('@/pages/evaluations/EvaluationsCreate.vue')
const EvaluationEdit = () => import('@/pages/evaluations/EvaluationsEdit.vue')
const EvaluationTake = () => import('@/pages/evaluations/EvaluationTake.vue')
const EvaluationResults = () => import('@/pages/evaluations/EvaluationResults.vue')

const Certificates = () => import('@/pages/certificates/CertificatesIndex.vue')
const CertificateTemplates = () => import('@/pages/certificates/CertificateTemplatesIndex.vue')
const CertificateTemplateCreate = () => import('@/pages/certificates/CertificateTemplateCreate.vue')
const CertificateTemplateEdit = () => import('@/pages/certificates/CertificateTemplateEdit.vue')

const MasterDashboard = () => import('@/pages/admin/MasterDashboard.vue')

// Organizational
const OrganigramPage = () => import('@/pages/organizational/OrganigramPage.vue')
const BranchesIndex = () => import('@/pages/organizational/BranchesIndex.vue')
const AreasIndex = () => import('@/pages/organizational/AreasIndex.vue')
const ProcessesIndex = () => import('@/pages/organizational/ProcessesIndex.vue')
const PositionsIndex = () => import('@/pages/organizational/PositionsIndex.vue')

// Documents
const DocumentsIndex = () => import('@/pages/documents/DocumentsIndex.vue')
const DocumentUpload = () => import('@/pages/documents/DocumentUpload.vue')
const DocumentAssign = () => import('@/pages/documents/DocumentAssign.vue')

// Gamification
const GamificationIndex = () => import('@/pages/gamification/GamificationIndex.vue')
const LeaderboardPage = () => import('@/pages/gamification/LeaderboardPage.vue')
const BadgesIndex = () => import('@/pages/gamification/BadgesIndex.vue')
const ChallengesIndex = () => import('@/pages/gamification/ChallengesIndex.vue')

// WhatsApp
const WhatsAppSchedules = () => import('@/pages/whatsapp/WhatsAppSchedules.vue')
const WhatsAppMessages = () => import('@/pages/whatsapp/WhatsAppMessages.vue')

// Surveys
const SurveysIndex = () => import('@/pages/whatsapp/SurveysIndex.vue')
const SurveyResults = () => import('@/pages/whatsapp/SurveyResults.vue')

const NotFound = () => import('@/views/errors/NotFound.vue')

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------
const routes = [
  // =========================================================================
  // Guest-only routes (redirect authenticated users to dashboard)
  // =========================================================================
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      guest: true,
      title: 'Login',
      breadcrumb: 'Login',
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      guest: true,
      title: 'Register',
      breadcrumb: 'Register',
    },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: {
      guest: true,
      title: 'Forgot Password',
      breadcrumb: 'Forgot Password',
    },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: {
      guest: true,
      title: 'Reset Password',
      breadcrumb: 'Reset Password',
    },
  },

  // =========================================================================
  // Authenticated routes (wrapped in AppLayout)
  // =========================================================================
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      // Root redirect
      {
        path: '',
        redirect: { name: 'Dashboard' },
      },

      // --- Dashboard ---
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: 'Dashboard',
          breadcrumb: 'Dashboard',
        },
      },

      // --- Profile ---
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: {
          title: 'Profile',
          breadcrumb: 'Profile',
        },
      },

      // --- Employees ---
      {
        path: 'employees',
        name: 'Employees',
        component: Employees,
        meta: {
          title: 'Employees',
          breadcrumb: 'Employees',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'employees/create',
        name: 'EmployeeCreate',
        component: EmployeeCreate,
        meta: {
          title: 'Create Employee',
          breadcrumb: 'Create Employee',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'employees/:id/edit',
        name: 'EmployeeEdit',
        component: EmployeeEdit,
        meta: {
          title: 'Edit Employee',
          breadcrumb: 'Edit Employee',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },

      // --- Courses ---
      {
        path: 'courses',
        name: 'Courses',
        component: Courses,
        meta: {
          title: 'Courses',
          breadcrumb: 'Courses',
        },
      },
      {
        path: 'courses/create',
        name: 'CourseCreate',
        component: CourseCreate,
        meta: {
          title: 'Create Course',
          breadcrumb: 'Create Course',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'courses/:id',
        name: 'CourseDetail',
        component: CourseDetail,
        meta: {
          title: 'Course Details',
          breadcrumb: 'Course Details',
        },
      },
      {
        path: 'courses/:id/edit',
        name: 'CourseEdit',
        component: CourseEdit,
        meta: {
          title: 'Edit Course',
          breadcrumb: 'Edit Course',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'courses/categories',
        name: 'CourseCategories',
        component: CourseCategories,
        meta: {
          title: 'Course Categories',
          breadcrumb: 'Course Categories',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },

      // --- Microlearning ---
      {
        path: 'microlearning',
        name: 'Microlearning',
        component: Microlearning,
        meta: {
          title: 'Microlearning',
          breadcrumb: 'Microlearning',
        },
      },
      {
        path: 'microlearning/create',
        name: 'MicrolearningCreate',
        component: MicrolearningCreate,
        meta: {
          title: 'Create Microlearning',
          breadcrumb: 'Create Microlearning',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'microlearning/assign',
        name: 'MicrolearningAssign',
        component: MicrolearningAssign,
        meta: {
          title: 'Assign Microlearning',
          breadcrumb: 'Assign Microlearning',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },

      // --- Questions ---
      {
        path: 'questions',
        name: 'Questions',
        component: Questions,
        meta: {
          title: 'Questions',
          breadcrumb: 'Questions',
        },
      },
      {
        path: 'questions/create',
        name: 'QuestionCreate',
        component: QuestionCreate,
        meta: {
          title: 'Create Question',
          breadcrumb: 'Create Question',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'questions/:id/edit',
        name: 'QuestionEdit',
        component: QuestionEdit,
        meta: {
          title: 'Edit Question',
          breadcrumb: 'Edit Question',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'questions/categories',
        name: 'QuestionCategories',
        component: QuestionCategories,
        meta: {
          title: 'Question Categories',
          breadcrumb: 'Question Categories',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },

      // --- Evaluations ---
      {
        path: 'evaluations',
        name: 'Evaluations',
        component: Evaluations,
        meta: {
          title: 'Evaluations',
          breadcrumb: 'Evaluations',
        },
      },
      {
        path: 'evaluations/create',
        name: 'EvaluationCreate',
        component: EvaluationCreate,
        meta: {
          title: 'Create Evaluation',
          breadcrumb: 'Create Evaluation',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'evaluations/:id/edit',
        name: 'EvaluationEdit',
        component: EvaluationEdit,
        meta: {
          title: 'Edit Evaluation',
          breadcrumb: 'Edit Evaluation',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'evaluations/:id/take',
        name: 'EvaluationTake',
        component: EvaluationTake,
        meta: {
          title: 'Take Evaluation',
          breadcrumb: 'Take Evaluation',
        },
      },
      {
        path: 'evaluations/:id/results',
        name: 'EvaluationResults',
        component: EvaluationResults,
        meta: {
          title: 'Evaluation Results',
          breadcrumb: 'Evaluation Results',
        },
      },

      // --- Certificates ---
      {
        path: 'certificates',
        name: 'Certificates',
        component: Certificates,
        meta: {
          title: 'Certificates',
          breadcrumb: 'Certificates',
        },
      },
      {
        path: 'certificates/templates',
        name: 'CertificateTemplates',
        component: CertificateTemplates,
        meta: {
          title: 'Certificate Templates',
          breadcrumb: 'Certificate Templates',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'certificates/templates/create',
        name: 'CertificateTemplateCreate',
        component: CertificateTemplateCreate,
        meta: {
          title: 'Create Certificate Template',
          breadcrumb: 'Create Certificate Template',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'certificates/templates/:id/edit',
        name: 'CertificateTemplateEdit',
        component: CertificateTemplateEdit,
        meta: {
          title: 'Edit Certificate Template',
          breadcrumb: 'Edit Certificate Template',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      // --- Organizational ---
      {
        path: 'organizational/orgchart',
        name: 'OrganigramPage',
        component: OrganigramPage,
        meta: {
          title: 'Organigrama',
          breadcrumb: 'Organigrama',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'organizational/branches',
        name: 'Branches',
        component: BranchesIndex,
        meta: {
          title: 'Sucursales',
          breadcrumb: 'Sucursales',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'organizational/areas',
        name: 'Areas',
        component: AreasIndex,
        meta: {
          title: 'Áreas',
          breadcrumb: 'Áreas',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'organizational/processes',
        name: 'Processes',
        component: ProcessesIndex,
        meta: {
          title: 'Procesos',
          breadcrumb: 'Procesos',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'organizational/positions',
        name: 'Positions',
        component: PositionsIndex,
        meta: {
          title: 'Cargos',
          breadcrumb: 'Cargos',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },

      // --- Documents ---
      {
        path: 'documents',
        name: 'Documents',
        component: DocumentsIndex,
        meta: {
          title: 'Documentos',
          breadcrumb: 'Documentos',
        },
      },
      {
        path: 'documents/upload',
        name: 'DocumentUpload',
        component: DocumentUpload,
        meta: {
          title: 'Subir Documento',
          breadcrumb: 'Subir Documento',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'documents/assign',
        name: 'DocumentAssign',
        component: DocumentAssign,
        meta: {
          title: 'Asignar Documento',
          breadcrumb: 'Asignar Documento',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },

      // --- Gamification ---
      {
        path: 'gamification',
        name: 'Gamification',
        component: GamificationIndex,
        meta: {
          title: 'Gamificación',
          breadcrumb: 'Gamificación',
        },
      },
      {
        path: 'gamification/leaderboard',
        name: 'Leaderboard',
        component: LeaderboardPage,
        meta: {
          title: 'Tabla de Posiciones',
          breadcrumb: 'Tabla de Posiciones',
        },
      },
      {
        path: 'gamification/badges',
        name: 'Badges',
        component: BadgesIndex,
        meta: {
          title: 'Insignias',
          breadcrumb: 'Insignias',
        },
      },
      {
        path: 'gamification/challenges',
        name: 'Challenges',
        component: ChallengesIndex,
        meta: {
          title: 'Desafíos',
          breadcrumb: 'Desafíos',
        },
      },

      // --- WhatsApp ---
      {
        path: 'whatsapp/schedules',
        name: 'WhatsAppSchedules',
        component: WhatsAppSchedules,
        meta: {
          title: 'Programaciones WhatsApp',
          breadcrumb: 'Programaciones WhatsApp',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },
      {
        path: 'whatsapp/messages',
        name: 'WhatsAppMessages',
        component: WhatsAppMessages,
        meta: {
          title: 'Historial WhatsApp',
          breadcrumb: 'Historial WhatsApp',
          roles: ['Administrador Empresa', 'Super Administrador'],
        },
      },

      // --- Surveys ---
      {
        path: 'surveys',
        name: 'Surveys',
        component: SurveysIndex,
        meta: {
          title: 'Encuestas',
          breadcrumb: 'Encuestas',
        },
      },
      {
        path: 'surveys/:id/results',
        name: 'SurveyResults',
        component: SurveyResults,
        meta: {
          title: 'Resultados de Encuesta',
          breadcrumb: 'Resultados de Encuesta',
        },
      },
      // --- Master / Super-Admin ---
      {
        path: 'admin',
        name: 'MasterDashboard',
        component: MasterDashboard,
        meta: {
          title: 'Panel Maestro',
          breadcrumb: 'Panel Maestro',
          masterOnly: true,
        },
      },
    ],
  },

  // =========================================================================
  // 404 — Catch-all
  // =========================================================================
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: 'Page Not Found',
      breadcrumb: 'Not Found',
    },
  },
]

// ---------------------------------------------------------------------------
// Router instance
// ---------------------------------------------------------------------------
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    // Always scroll to top on navigation
    return { top: 0 }
  },
})

// ---------------------------------------------------------------------------
// Global navigation guards
// ---------------------------------------------------------------------------
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // --- Dynamic document title ---
  const baseTitle = 'Nexora Learning Platform'
  document.title = to.meta.title
    ? `${to.meta.title} | ${baseTitle}`
    : baseTitle

  // --- Root redirect: Master → /admin, Company users → /dashboard ---
  if (to.path === '/' && authStore.isAuthenticated) {
    if (authStore.isSuperAdmin) {
      return next({ name: 'MasterDashboard' })
    }
    return next({ name: 'Dashboard' })
  }

  // --- Master redirect: /dashboard → /admin for Super Admin ---
  if (to.name === 'Dashboard' && authStore.isSuperAdmin) {
    return next({ name: 'MasterDashboard' })
  }

  // --- Authentication guard ---
  // Routes that require authentication redirect to /login if the user is not
  // logged in. The intended destination is preserved as a query parameter so
  // the user can be redirected back after successful login.
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!authStore.isAuthenticated) {
      return next({
        name: 'Login',
        query: { redirect: to.fullPath },
      })
    }
  }

  // --- Guest-only guard ---
  // Redirect authenticated users: Master → /admin, Company users → /dashboard
  if (to.meta.guest && authStore.isAuthenticated) {
    if (authStore.isSuperAdmin) {
      return next({ name: 'MasterDashboard' })
    }
    return next({ name: 'Dashboard' })
  }

  // --- Master-only guard ---
  if (to.meta.masterOnly && !authStore.isSuperAdmin) {
    return next({ name: 'Dashboard' })
  }

  // --- Role-based access guard ---
  const requiredRoles = to.meta.roles
  if (requiredRoles && Array.isArray(requiredRoles) && requiredRoles.length > 0) {
    const currentUser = authStore.user

    if (!currentUser) {
      authStore.restoreSession()
    }

    const userRoles = authStore.user?.roles || []
    const hasRole = requiredRoles.some((r) => userRoles.includes(r))

    if (!hasRole) {
      return next({ name: 'Dashboard' })
    }
  }

  next()
})

export default router
