1 

# **SchoolNode** 

Daniel Felipe Serna López 

Asesor 

Luis Eyder Ortiz Collazos 

# Universidad Nacional Abierta y a Distancia UNAD 

Escuela de ciencias básicas, tecnología e ingeniería ECBTI 

Ingeniería de Sistemas 

2026 

2 

# **Resumen** 

La gestión administrativa y el recaudo financiero en pequeñas instituciones educativas y centros de educación no formal suelen depender de procesos manuales, propensos a errores de conciliación y vulnerabilidades en la seguridad de la información. Para mitigar esta 

problemática, el presente proyecto propone el desarrollo de SchoolNode, un MVC de código abierto (Open Source) diseñada para la automatización de matrículas y el control financiero. El sistema se construye bajo una arquitectura moderna utilizando Node.js y MongoDB, garantizando alta concurrencia y flexibilidad en la gestión de expedientes. La solución integra un sistema de autenticación basado en roles (RBAC) y la pasarela de pagos Stripe para la activación automática de servicios en tiempo real. La propuesta se valida mediante su aplicación práctica en el centro de enseñanza "Motos BSA la 23", permitiendo aterrizar los desarrollos técnicos a las necesidades operativas de un entorno de formación real. La metodología de desarrollo se enmarca en el modelo ágil Scrum, asegurando un despliegue escalable mediante la contenedorización con Docker. SchoolNode representa una alternativa tecnológica eficiente que optimiza los flujos de caja y democratiza el acceso a herramientas de gestión empresarial 

**_Palabras clave:_** API, automatización, matrícula, recaudo, implementación. 

3 

# **Abstract** 

Administrative management and financial collection in small educational institutions and non-formal education centers often rely on manual processes, prone to reconciliation errors and information security vulnerabilities. To mitigate this problem, this project proposes the development of SchoolNode, an open-source RESTful API designed for automating enrollment and financial control. The system is built on a modern architecture using Node.js and MongoDB, ensuring high concurrency and flexibility in record management. The solution integrates a rolebased authentication (RBAC) system and the Stripe payment gateway for automatic, real-time service activation. The proposal is validated through its practical application in teaching center “Motos BSA la 23”, allowing the technical developments to be tailored to the operational needs of a real-world training environment. The development methodology is based on the Scrum agile model, ensuring scalable deployment through containerization with Docker. SchoolNode represents an efficient technological alternative that optimizes cash flow and democratizes access to business management tools. 

**_Keywords:_** API, automation, enrollment, collections, implementation. 

4 

# **Tabla de Contenido** 

|Introducción...................................................................................................................................10|
|---|
|Justificación...................................................................................................................................12|
|Objetivos........................................................................................................................................14|
|Objetivo General.........................................................................................................................14|
|Objetivos Específicos.................................................................................................................14|
|Metodología...................................................................................................................................16|
|Tipo de proyecto.........................................................................................................................16|
|Metodología de desarrollo..........................................................................................................16|
|Fases de ejecución del proyecto.................................................................................................18|
|Fase 1: Levantamiento de Requerimientos y Análisis.............................................................18|
|Fase 2: Diseño de la Arquitectura y Modelo de Datos............................................................18|
|Fase 3: Desarrollo del Backend y Lógica de Negocio.............................................................18|
|Fase 4: Integración de Pasarela de Pagos (Stripe) ..................................................................19|
|Fase 4: Desarrollo del Frontend con EJS.................................................................................19|
|Stack Tecnológico......................................................................................................................19|
|Marco referencial...........................................................................................................................22|
|Marco teorico..............................................................................................................................22|
|Persistencia de Datos NoSQL (MongoDB y Mongoose)........................................................22|
|Entorno de Ejecución y Framework (Node.js y Express.js)....................................................23|
|Arquitectura de Software: Modelo-Vista-Controlador (MVC)...............................................23|
|Seguridad y Autenticación (JWT y RBAC)............................................................................24|
|Integración de Servicios Financieros (Stripe API)..................................................................26|



5 

|Despliegue y Portabilidad (Docker y PaaS)............................................................................26|
|---|
|Marco conceptual.......................................................................................................................27|
|Cronograma de actividades............................................................................................................29|
|Recursos necesarios.......................................................................................................................30|
|Resultados esperados.....................................................................................................................31|
|Desarrollo Frontend.......................................................................................................................32|
|Pantallas de la aplicación............................................................................................................32|
|Modelo de usuario-aplicación....................................................................................................49|
|Desarrollo Backend........................................................................................................................51|
|Base de datos..............................................................................................................................51|
|Modelado de Entidades, Restricciones, Relaciones y Funciones...............................................52|
|User..........................................................................................................................................52|
|Estudiante................................................................................................................................54|
|Curso........................................................................................................................................55|
|Aula..........................................................................................................................................56|
|Matricula (entidad central)......................................................................................................57|
|Configuración..........................................................................................................................59|
|Diagrama de relaciones..............................................................................................................60|
|Referencias Bibliográficas.............................................................................................................61|
|Apéndices.......................................................................................................................................64|
|¿Qué es el centro de enseñanzas la 23?......................................................................................64|
|Consentimiento académico.........................................................................................................65|



6 

7 

# **Lista de Figuras** 

|**Figura 1**_Descripción del modelo de persistencia de datos_..........................................................23|
|---|
|**Figura 2**_Modelo de routing_..........................................................................................................24|
|**Figura 3**_MVC_................................................................................................................................25|
|**Figura 4**_RBAC, y persistencia de sesión_......................................................................................26|
|**Figura 5** _Pasarela de pagos_.........................................................................................................27|
|**Figura 6** _Despliegue_.....................................................................................................................28|
|**Figura 7**_Vista de login_..................................................................................................................33|
|**Figura 8**_Vista de alumnos_............................................................................................................34|
|**Figura 9**_Vista de cursos_................................................................................................................35|
|**Figura 10**_Vista de cursos, nueva aula_..........................................................................................36|
|**Figura 11**_Vista de cursos, nuevo curso_........................................................................................37|
|**Figura 12**_Vista de pagos_..............................................................................................................38|
|**Figura 13** _Vista de ajustes, primera parte._...................................................................................39|
|**Figura 14** _Vista de ajustes, segunda parte_...................................................................................40|
|**Figura 15**_Vista de ajustes, crear usuario_.....................................................................................41|
|**Figura 16** _Vista de ajustes, cambio de credenciales_....................................................................42|
|**Figura 17**_Vista de usuario_............................................................................................................43|
|**Figura 18**_Vista de usuario, cambio de contraseña_......................................................................44|
|**Figura 19**_Vista de usuaario, cambio de ID_..................................................................................45|
|**Figura 20**_Vista de ayuda_..............................................................................................................46|
|**Figura 21**_Vista de matricula_........................................................................................................47|



8 

|**Figura 22**_Vista de notificaciones_..................................................................................................48|
|---|
|**Figura 23**_Vista pasarela de pagos_...............................................................................................49|
|**Figura 24** Modelo de seguridad en el frontend...........................................................................50|
|**Figura 25**Modelo de servicio de datos en EJS.............................................................................51|
|**Figura 26** _Diagrama de entidad-relación_....................................................................................61|
|**Figura 7**_Consentimiento académico_.............................................................................................66|



9 

# **Lista de Tablas** 

|**Tabla 1** _Cronograma de actividades_............................................................................................28|
|---|
|**Tabla 2** _Recursos necesarios_........................................................................................................29|
|**Tabla 3** _Resultados esperados_......................................................................................................30|



10 

# **Lista de Apéndices** 

**Apéndice A** _Ejemplo de Apéndice_ ................................................................................................21 

11 

# **Introducción** 

En la actualidad, la transformación digital no representa únicamente una ventaja competitiva, sino una necesidad operativa para las instituciones que buscan optimizar su gestión interna y garantizar la transparencia financiera. Sin embargo, en el sector de la educación no formal y los centros de enseñanza especializados en Colombia, persiste una brecha tecnológica significativa. Muchas de estas organizaciones aún dependen de procesos manuales para la administración de matrículas y el recaudo de pagos, lo que deriva en errores de conciliación, cuellos de botella administrativos y una experiencia de usuario deficiente. 

La literatura académica reciente subraya que la automatización de estos procesos puede reducir los tiempos de gestión hasta en un 66%, mejorando sustancialmente la eficiencia operativa (Universidad Peruana de Ciencias Aplicadas, 2021). A pesar de estos beneficios, las soluciones comerciales existentes suelen ser costosas o demasiado complejas para las pequeñas y medianas instituciones. Bajo este contexto surge SchoolNode, una aplicación web de código abierto (Open Source) diseñada como una solución integral, ligera y de fácil implementación para la automatización administrativa. 

A diferencia de las arquitecturas tradicionales de caja negra, SchoolNode se desarrolla bajo un patrón de arquitectura Modelo-Vista-Controller (MVC), utilizando el entorno de ejecución Node.js y el motor de plantillas EJS para ofrecer una interfaz dinámica y eficiente. La persistencia de datos se gestiona a través de MongoDB, permitiendo una estructura NoSQL flexible para el manejo de expedientes estudiantiles. Además, la seguridad se garantiza mediante la implementación de JSON Web Tokens (JWT) y el control de acceso basado en roles (RBAC), mientras que la gestión financiera se automatiza mediante la integración de la pasarela de pagos Stripe. 

12 

Para validar la eficacia de este desarrollo, el proyecto se aterriza mediante un caso de estudio real en el centro de enseñanza "Motos BSA la 23". Esta implementación permite ajustar los requerimientos técnicos a las necesidades operativas de un entorno de formación vial, donde la gestión de cupos y la verificación inmediata de pagos son críticas para el flujo de caja. Finalmente, el uso de la contenedorización con Docker asegura que el sistema sea escalable y portable, permitiendo que otras instituciones con infraestructuras limitadas puedan adoptar esta tecnología de manera ágil. 

El presente documento detalla el proceso de diseño, desarrollo y validación de SchoolNode, demostrando cómo la ingeniería de sistemas puede democratizar el acceso a herramientas de gestión empresarial robustas y seguras para el sector educativo local. 

13 

# **Justificación** 

El desarrollo de SchoolNode se justifica por la necesidad apremiante de modernizar los procesos administrativos en instituciones de educación no formal y centros de enseñanza especializados que, debido a limitaciones presupuestales o técnicas, han quedado al margen de la transformación digital. La relevancia de este proyecto se desglosa en los siguientes aspectos: Desde la perspectiva administrativa y operativa, la gestión manual de matrículas y recaudos financieros representa un cuello de botella que compromete la eficiencia institucional. La implementación de procesos automatizados permite una reducción de hasta el 66% en los tiempos de respuesta (Universidad Peruana de Ciencias Aplicadas, 2021), eliminando la carga operativa de tareas repetitivas y mitigando el riesgo de errores humanos en la conciliación de pagos. En el caso específico de la "Motos BSA la 23", esta solución permite que el flujo de información entre el registro del aspirante y la validación del pago sea inmediato, optimizando la capacidad de respuesta del centro ante la demanda de sus servicios. 

En el ámbito técnico, el proyecto demuestra la viabilidad de utilizar arquitecturas monolíticas bajo el patrón Modelo-Vista-Controlador (MVC) para resolver problemas complejos de manera ágil. El uso de Node.js y EJS permite un desarrollo robusto y de fácil mantenimiento, ideal para instituciones con infraestructura limitada. Además, la integración de la pasarela de pagos Stripe y la seguridad basada en JWT y RBAC eleva los estándares de protección de datos y confiabilidad financiera, alineándose con las tendencias globales de comercio electrónico y ciberseguridad. 

Desde el impacto socioeconómico y el modelo Open Source, SchoolNode se posiciona como una alternativa democrática frente a los costosos software de gestión propietarios. Al ser una herramienta de código abierto, no solo beneficia a la "Motos BSA la 23" mediante un ahorro 

14 

significativo en licencias, sino que queda a disposición de la comunidad global de 

desarrolladores y pequeñas instituciones. Esto fomenta la soberanía tecnológica y permite que otros centros educativos en contextos similares puedan adaptar la herramienta a sus necesidades específicas sin incurrir en deudas técnicas o financieras insostenibles (Arias Ortiz et al., 2021). Finalmente, la pertinencia académica de este trabajo radica en la aplicación práctica de conceptos de ingeniería de sistemas —como la persistencia de datos NoSQL con MongoDB, la contenedorización con Docker y la lógica de negocios aplicada— para resolver una problemática real en el entorno local de Tuluá y la región. Este proyecto no solo valida el conocimiento técnico adquirido, sino que entrega un producto funcional que impacta directamente en la productividad de una empresa real. 

15 

# **Objetivos** 

# **Objetivo General** 

Desarrollar e implementar la aplicación web **SchoolNode** bajo una arquitectura de 

software Modelo-Vista-Controlador (MVC), con el fin de automatizar los procesos de matrícula 

y el recaudo financiero, validando su eficacia mediante un caso de estudio real en el centro de 

enseñanza **"Motos BSA la 23"** . 

# **Objetivos Específicos** 

- **Diseñar** la arquitectura lógica del sistema y el modelo de datos no relacional en 

   - **MongoDB** , asegurando una estructura flexible para la gestión de expedientes estudiantiles y el control de cupos. 

- **Desarrollar** la interfaz de usuario dinámica y la lógica del servidor utilizando **Node.js** y el motor de plantillas **EJS** , permitiendo una navegación fluida y una integración estética con la identidad visual de la institución. 

- **Integrar** la pasarela de pagos **Stripe** mediante el uso de webhooks, para garantizar el procesamiento seguro de transacciones y la actualización automática del estado de matrícula en tiempo real. 

- **Implementar** un sistema de seguridad basado en **JSON Web Tokens (JWT)** y control de acceso por roles (RBAC), para proteger la integridad de la información administrativa y financiera. 

- **Desplegar** la aplicación mediante la contenedorización con **Docker** , asegurando la 

   - portabilidad del sistema y facilitando su implementación en diversos entornos de 

infraestructura tecnológica. 

16 

- **Evaluar** el rendimiento y la usabilidad de la herramienta en el entorno operativo de la 

   - **"Motos BSA la 23"** , verificando la reducción de tiempos en el proceso de inscripción y 

la fiabilidad de la conciliación de pagos. 

17 

# **Metodología** 

# **Tipo de proyecto** 

El presente trabajo se define como un Proyecto Aplicado bajo la modalidad de Desarrollo Tecnológico. Esta elección se fundamenta en que el objetivo principal es la creación de un producto de software funcional —SchoolNode— diseñado para resolver una problemática específica de gestión administrativa y financiera en un entorno real. 

El proyecto no se limita a una investigación teórica, sino que busca el "aterrizaje" de conocimientos técnicos en el centro de enseñanza "Motos BSA la 23" ubicado en Tuluá, Valle del Cauca. A través de este enfoque, se validará la viabilidad de la arquitectura propuesta y su impacto directo en la optimización operativa de la institución, cumpliendo con los requisitos de innovación y aplicación práctica exigidos por la Universidad Nacional Abierta y a Distancia (UNAD). 

# **Metodología de desarrollo** 

Para la gestión y ejecución del ciclo de vida del software, se ha seleccionado el marco de trabajo ágil **Scrum** . Esta elección permite un desarrollo incremental, flexible y adaptativo, asegurando entregas constantes de valor funcional al centro de enseñanza "Motos BSA la 23". 

Debido a la naturaleza del proyecto, donde el desarrollo es liderado por un único ingeniero, el marco de trabajo se adapta para maximizar la eficiencia operativa sin perder el rigor metodológico. Para garantizar la transparencia, el seguimiento y el orden del proceso, se integrará la plataforma Taiga como herramienta central de gestión. 

La adaptación de Scrum bajo este esquema se desglosa de la siguiente manera: 

- **Roles:** 

18 

- **Product Owner:** Representado por el representante de la "Motos BSA la 23", 

quien actúa como el cliente principal. 

- **Scrum Master y Developer** : Asumidos por el desarrollador, quien es responsable 

de la gestión técnica, el diseño de la arquitectura y la codificación de la solución bajo los estándares de calidad definidos. 

- **Gestión del Proyecto en Taiga:** Como pilar para la organización del flujo de trabajo, se 

utilizará Taiga, una plataforma de gestión de proyectos de código abierto alineada con la filosofía del proyecto. Mediante esta herramienta se gestionarán los siguientes elementos: 

   - **Product Backlog** : Centralización de todos los requerimientos técnicos y funcionales en forma de historias de usuario, priorizadas según el impacto en la operación de la Motos BSA la 23. 

   - **Sprint Planning:** Organización de ciclos de trabajo de dos semanas, donde se seleccionan las tareas específicas que se moverán del backlog al sprint activo. 

   - **Tablero Sprint (Kanban):** Visualización en tiempo real del estado de cada tarea (Por hacer, En curso, En pruebas, Finalizado), permitiendo una trazabilidad total del progreso del desarrollo. 

- **Eventos e Incrementos** : Al finalizar cada sprint, se generará un incremento de software 

funcional (por ejemplo, el módulo de autenticación o el sistema de pagos). Para lo 

anterior se busca una filosofía de desarrollo centrada en la modualización de 

funcionalidades. 

19 

# **Fases de ejecución del proyecto** 

La ejecución del proyecto se organiza en seis fases secuenciales e iterativas, permitiendo que cada avance técnico sea validado funcionalmente antes de proceder al siguiente componente de la arquitectura. 

# **_Fase 1: Levantamiento de Requerimientos y Análisis_** 

En esta fase inicial se realizan sesiones de trabajo con el personal administrativo del centro de enseñanza "Motos BSA la 23" para identificar los puntos críticos del proceso de matrícula actual. Los hallazgos se traducen en historias de usuario que se cargan en el Product Backlog de Taiga. Se definen los campos obligatorios para el recaudo de información (nombre, contacto, correo) y las reglas de negocio, como el límite máximo de cupos por periodo académico. 

# **_Fase 2: Diseño de la Arquitectura y Modelo de Datos_** 

Se define la estructura técnica bajo el patrón Modelo-Vista-Controlador (MVC). En esta etapa se diseña el esquema de la base de datos no relacional en MongoDB, estableciendo las colecciones para usuarios, estudiantes, transacciones y configuraciones globales. Asimismo, se planifica la jerarquía de carpetas en el servidor de Node.js para separar la lógica de las rutas, los controladores y las vistas. 

# **_Fase 3: Desarrollo del Backend y Lógica de Negocio_** 

Se procede con la codificación del núcleo del sistema utilizando Express.js. Se 

implementan los controladores encargados de procesar la lógica de inscripción y la validación de cupos. En esta fase se desarrolla el sistema de seguridad mediante JSON Web Tokens (JWT) y middlewares de autenticación, asegurando que solo el personal administrativo autorizado de la Motos BSA la 23 pueda acceder a la gestión de matrículas. 

20 

# **_Fase 4: Integración de Pasarela de Pagos (Stripe)_** 

Esta fase técnica crítica consiste en conectar el sistema con la API de Stripe. Se 

configuran los endpoints de pago y, fundamentalmente, el uso de Webhooks. Esto permite que, una vez que el estudiante complete el pago de manera exitosa en la pasarela externa, SchoolNode reciba una notificación automática que actualice el registro en la base de datos de MongoDB de forma inmediata, sin intervención humana. 

# **_Fase 4: Desarrollo del Frontend con EJS_** 

Se construyen las interfaces de usuario utilizando el motor de plantillas EJS. El enfoque 

se centra en crear una experiencia de usuario (UX) fluida y adaptada a la identidad visual de la institución. 

- Interfaz Pública: Formulario de captura de datos y visualización de costos. 

- Interfaz Administrativa: Panel de control (Dashboard) donde se listan los estudiantes matriculados y sus estados de pago. Se utiliza CSS para asegurar que el diseño sea profesional y responsivo, facilitando su integración en el sitio web existente de la Motos BSA la 23. 

# **Stack Tecnológico** 

Para el desarrollo de **SchoolNode** , se ha seleccionado un conjunto de tecnologías 

modernas y de código abierto que garantizan un ecosistema robusto, escalable y con una curva de aprendizaje eficiente. La integración de estas herramientas permite consolidar una 

arquitectura **MVC (Modelo-Vista-Controlador)** sólida. 

21 

# **_Backend y Lógica de Servidor_ :** 

- **Node.js:** Entorno de ejecución de JavaScript basado en el motor V8 de Chrome, 

seleccionado por su arquitectura orientada a eventos y su modelo de E/S no bloqueante, ideal para manejar múltiples peticiones concurrentes. 

- **Express.js:** Framework minimalista para Node.js que facilita la gestión de rutas, 

middlewares y la configuración del servidor, permitiendo una estructura organizada de la lógica de negocio. 

# **_Persistencia de Datos_ :** 

- **MongoDB:** Base de datos NoSQL orientada a documentos, elegida por su flexibilidad para manejar expedientes estudiantiles y registros de transacciones con esquemas dinámicos. 

- **Mongoose:** ODM (Object Data Modeling) que permite definir esquemas y modelos de datos dentro del código de Node.js, facilitando la validación, la realización de consultas complejas y la interacción con MongoDB de manera estructurada. 

- **MongoDB Atlas:** Servicio de base de datos en la nube (DBaaS) que garantiza la 

   - disponibilidad de los datos, copias de seguridad automáticas y escalabilidad sin necesidad 

de gestionar la infraestructura física del servidor de base de datos. 

# **_Frontend y Visualización_ :** 

- **EJS (Embedded JavaScript):** Motor de plantillas que permite generar HTML dinámico en el servidor. Su uso es clave para renderizar las vistas del administrador y el formulario de matrícula, integrando variables del backend directamente en el frontend de forma ágil. 

22 

- **HTML5 y CSS3:** Estándares para la estructura y el diseño visual de la aplicación, 

asegurando una interfaz profesional y adaptable ( _responsive_ ) a diferentes dispositivos. 

# **_Seguridad y Finanzas_ :** 

- **jsonwebtoken (JWT):** Estándar para la creación de tokens de acceso que permiten la autenticación segura y el manejo de sesiones para los usuarios administrativos, operando de forma eficiente con los middlewares de Express. 

- **Stripe API:** Infraestructura de pagos integrada para el procesamiento de transacciones 

   - financieras. Se utiliza para gestionar el recaudo de matrículas de manera segura, 

cumpliendo con los estándares internacionales de protección de datos bancarios. 

# **_Infraestructura y Gestión_ :** 

- **Docker:** Plataforma de contenedorización utilizada para empaquetar la aplicación y todas sus dependencias. Esto asegura que el sistema funcione de manera idéntica en el entorno de desarrollo y en el servidor de producción de la **"Motos BSA la 23"** . 

- **Git / GitHub:** Herramientas para el control de versiones y el almacenamiento del código fuente, permitiendo una gestión organizada del progreso del proyecto y la colaboración en un entorno de código abierto. 

- **Railway:** Esta herramienta garantiza una alta disponibilidad del servicio, evitando la latencia por suspensión de instancias y permitiendo una integración fluida de los webhooks de Stripe **.** 



<!-- Start of picture text -->
MONGOOSE<br>PETICION. CRUDA, ESQUEMADEL ESQUEMADEL PETICION. FILTRADA POR<br>POTENCIALMENTE MODELO DE MODELO DE LAS REGLAS DE LOS<br>CLIENTE ————>PELIGROSA DATOS DATOS SSESQUEMAS DE DATOS MONGODB ATLAS<br>ESQUEMA ESQUEMA<br>DEL DEL<br>MODELO DE MODELO DE<br>DATOS DATOS<br><!-- End of picture text -->



<!-- Start of picture text -->
CONTROLADOR (NODE.JS)<br>FRAMEWORK (EXPRESS)<br>EXPRESS ROUTER<br><!-- End of picture text -->



<!-- Start of picture text -->
CONTROLADOR “E59<br>S (NODEJS - EXPRESS) “3p,°<br>ee Uo,<br>wg Ny,<br>) LS % Op<br>Sys sg<br>& Oy<br>“Nn<br>om<br>as<br>VISTA 52<br>2 S MODELO<br>(CLIENTE EN EJS) (MONGODB)<br>RESPUESy, ©<br>USUARIO<br><!-- End of picture text -->



<!-- Start of picture text -->
ERROR<br>' CONTROLADOR |<br>RUTA DE LOGIN<br>TOKEN SI<br>{CREDENCIALES '<br>CORRECTAS? '<br>PETICION ' '<br>DE LOGIN ;<br>CLIENTE RUTA PROTEGIDA<br>CON AUTORIZACION<br>PETICION ' '<br>CON<br>TOKEN<br>{TOKEN NO<br>7 CORRECTO? - 1<br>| RESPUESTA | OO<br><!-- End of picture text -->



<!-- Start of picture text -->
REDIRECCION AL CLIENTE DE PAGOS DE STRIPE<br>' CONTROLADOR ! STRIPE !<br>CLIENTE > | REALIZARPAGO) 1|| 5 |!<br>!PAGO EXITOSO |<br>2PAGO<br>: REALIZADO?<br>) PAGO FALLIDO . | !<br>TRANSACCION HECHA, O CANCELADA<br><!-- End of picture text -->



<!-- Start of picture text -->
! Railway<br>‘| INSTANCIADE |:<br>! DOCKER ' WEB<br>'[INSTALAGION DE |: cp<br>‘| DEPENDENCIAS |;<br>GitHub ‘| DESPLIEGUE<br><!-- End of picture text -->

29 

llamada "contenedor" (ej. Docker). Conceptualmente, esto garantiza que el software funcione de manera idéntica en el entorno de desarrollo local y en el servidor de producción. 

**Middleware:** En el contexto de Express.js, son funciones de software que tienen acceso a los objetos de petición y respuesta HTTP. Actúan como "filtros" o "puentes" que interceptan las solicitudes para ejecutar código intermedio, como la validación de formularios (expressvalidator) o la verificación de tokens de seguridad, antes de procesar la lógica principal. 

**PaaS (Platform as a Service):** Modelo de computación en la nube que proporciona un entorno listo para el despliegue de aplicaciones (en este caso, Railway). Permite a los desarrolladores alojar y ejecutar contenedores de software sin la necesidad de aprovisionar y mantener la infraestructura de hardware subyacente.Pasarela de Pago: Servicio tecnológico que autoriza y procesa transacciones financieras para negocios en línea, actuando como un 

intermediario seguro (cumpliendo normativas PCI) entre la aplicación web de la Motos BSA la 23 y las redes bancarias (ej. Stripe). 

**RBAC (Role-Based Access Control):** Mecanismo de ciberseguridad que restringe el acceso a los recursos del sistema basándose en la función o rol de cada usuario dentro de la organización. En SchoolNode, define jerarquías claras para asegurar que solo el personal administrativo interactúe con los módulos de recaudo y gestión de cupos. 

**Webhook:** Conocidas como "retrollamadas HTTP" o HTTP callbacks, son notificaciones automáticas enviadas de servidor a servidor cuando ocurre un evento específico. En esta 

arquitectura, permiten que la pasarela de pagos notifique en tiempo real a SchoolNode sobre una transacción exitosa, desencadenando la automatización de la matrícula. 

30 

# **Cronograma de actividades** 

El desarrollo e implementación del proyecto se ha estructurado en un periodo de 5 meses, 

alineado con las iteraciones de la metodología ágil Scrum. 

# **Tabla 1** 

# _Cronograma de actividades_ 

|Actividad|Mes Inicio|Mes Fin|% del Proyecto|
|---|---|---|---|
|Fase<br>1:<br>Análisis<br>y<br>Diseño:<br>Levantamiento<br>de<br>requerimientos en la "Motos BSA la 23", configuración de<br>Taiga y modelado de la base de datos (MongoDB).|1|1|15%|
|Fase 2: Core y Backend: Configuración del servidor<br>(Node.js/Express) y desarrollo del sistema de seguridad<br>(JWT, validaciones y RBAC).|1|2|20%|
|Fase 3: Frontend y Vistas: Construcción de las interfaces<br>dinámicas (EJS) para la captura de datos y el portal<br>administrativo.|2|3|20%|
|Fase 4: Motor Financiero: Integración de la API de Stripe,<br>configuración de Webhooks y lógica de control de cupos.|3|4|20%|
|Fase<br>5:<br>Pruebas<br>y<br>Despliegue:<br>Contenedorización<br>(Docker), despliegue en la nube (Railway) y pruebas de<br>usuario en la Motos BSA la 23.|4|4|15%|
|Fase 6: Documentación: Consolidación del documento<br>final de grado, manuales técnicos y preparación de la<br>sustentación.|4|5|10%|
|Total|||100%|



_Nota. Descripción numerica del tiempo que podría requerir cada una de las actividades para culminar el proyecto._ 

31 

# **Recursos necesarios** 

La ejecución de SchoolNode se apoya en un modelo de desarrollo de bajo costo, 

aprovechando herramientas de código abierto y plataformas en la nube con capas gratuitas o 

beneficios para estudiantes (como el GitHub Student Developer Pack). 

# **Tabla 2** 

_Recursos necesarios_ 

|Tipo de Recurso|Descripción|Presupuesto / Origen|
|---|---|---|
|Equipo Humano|Desarrollador<br>Full-Stack<br>(Arquitectura,<br>Backend,<br>Frontend EJS, DevOps).|Estudiante (Recurso propio)|
|Equipo Humano|Product Owner (Personal administrativo del centro de<br>enseñanza).|"Motos BSA la 23"<br>(Institución aliada)|
|Hardware|Equipo de cómputo para desarrollo y pruebas locales.|Recurso propio|
|Infraestructura<br>Cloud|Servidor de despliegue en PaaS (Railway) y Base de<br>Datos (MongoDB Atlas).|Capas gratuitas / Créditos<br>estudiantiles|
|Herramientas de<br>Gestión|Plataforma de metodología ágil (Taiga) y control de<br>versiones (Git/GitHub).|Open Source / Gratuito|
|Tecnologías<br>Core|Entorno Node.js, motor EJS, contenedorización Docker<br>y Stripe API.|Open Source / Servicios de<br>terceros|



_Nota. Recursos requeridos para el desarrollo del proyecto._ 

32 

# **Resultados esperados** 

El proyecto no solo entregará un artefacto de software, sino un conjunto de validaciones 

prácticas y documentación técnica que respaldan el rigor del proceso de ingeniería aplicada. 

# **Tabla 3** 

_Resultados esperados_ 

|Resultado o Producto<br>Esperado|Indicador de Cumplimiento|Beneficiario|
|---|---|---|
|Aplicación Web Funcional<br>(SchoolNode)|Sistema monolítico desplegado en Railway,<br>con procesamiento de pagos activo vía<br>webhooks de Stripe y renderizado dinámico<br>con EJS.|La "Motos BSA la 23"<br>y centros de<br>enseñanza de la<br>región.|
|Código Fuente<br>Contenedorizado|Repositorio<br>en<br>GitHub<br>con<br>el<br>código<br>documentado<br>y<br>el<br>archivo<br>Dockerfile<br>configurado para un despliegue ágil.|Comunidad Open<br>Source y<br>evaluadores.|
|Documentación Técnica|Manual técnico de instalación, diagrama de<br>arquitectura y diseño del modelo de datos<br>NoSQL.|Asesor de la UNAD y<br>futuros<br>mantenedores.|
|Informe Final de Grado|Documento<br>académico<br>aprobado<br>bajo<br>normativas institucionales, consolidando el<br>análisis, desarrollo y conclusiones.|Universidad (UNAD)<br>y estudiante.|



_Nota. Disposición de los entregables, y sus respectivos receptores._ 

|<logo><br><recuperarcontrasefia><br><acceder>|
|---|





<!-- Start of picture text -->
<logo> al<br>< > <titulo seccién> : i ‘ ‘<br>= F <total alumnos>| |<matriculas activas>| |<matriculas vencidas><br>(Gestion de Alumnos, y Matriculas)<br>cursos | <nombre> <ID> <curso> vencimiento>‘agile <estado> <acciones><br>< > . =<br>DanielSerna LopezFelipe 1116278383 cM1 17/12/2026 ACTIVO | <cancelar matricula><br>Danny ess Velasco | 493456789 cm2 17/07/2026 ACTIVO |___<cancelar matricula><br>eeeeee Ee Eee<br><!-- End of picture text -->



<!-- Start of picture text -->
<nombre escuela><br><logo> al<br><alumnos> <titulo secciodn> <total <total | |<agregar una nueva <agregar un nuevo<br>(Gestion de cursos, y aulas) cursos>| | aulas> aula> curso><br><cursos><br><aula> | <capacidad> | <poblacién actual> acciones<br><pagos><br>A01<br>A04 15<br><!-- End of picture text -->



<!-- Start of picture text -->
<nombre escuela><br><logo> jal<br><titulo seccién> <total || <total | |<agregar una nueva|| <agregar un nuevo<br>(Gestion de cursos, y aulas) cursos>| | aulas> aula> curso><br><cursos> -<br>Capacidad:<br>I<br>Ubicacion:<br>¢Asociar a un curso?<br>Sst:OQ NO:O<br>éCual?<br>CONFIRMAR<br><ajustes> | <ayuda><br><!-- End of picture text -->



<!-- Start of picture text -->
<logo> al<br><ubicaci6n><br><alumnos> <titulo seccién> <total || <total | |<agregar una nueva|| <agregar un nuevo<br>(Gestion de cursos, y aulas) cursos>| | aulas> aula> curso><br>|Nombre:<br>Asociar a un aula:<br>CONFIRMAR<br><salir><br><!-- End of picture text -->



<!-- Start of picture text -->
<logo> al<br><alumnos> <titulo seccién><br>(Gestion de pagos) <total ganado> <total en deuda><br><ID Alumno> <ID <pages <deuda actual>| <aportes> | <faltante> <acciones><br>Curso> | realizados><br><generarfacturade pago total><br><generar factura de aporte a total><br>1116278383 | A0O1 02 350.000 150.000 | 200.000<br><pago de forma fisica><br><generar factura depago total><br><generar factura de aporte a total><br>123456789 | A0O1 04 650.000 420.000 | 230.000<br><pago de forma fisica><br>ec<br><!-- End of picture text -->



<!-- Start of picture text -->
<nombre escuela><br><logo> al<br><ubicacién><br><alumnos> <titulo seccién> <Crear usuario para ome Q<br>(Ajustes #1) nuevo empleado> administrador>ne<br><cursos><br><pagos> Ajustes de la aplicacioén<br>Cambiar nombre de escuela: Colores de la aplicacion:<br>Cambiar logo de escuela: Ubicacion:<br><ajustes> | <ayuda><br><salir><br><!-- End of picture text -->



<!-- Start of picture text -->
<logo> al<br>ee <Crear usuario para “Parmer<br>(Ajustes #2) nuevo empleado> Eepekgncsadministrador>toe Ga<br>Ajustes de facturacién<br>Razé6n social: Direcci6n fiscal:<br>NIT: Telefono:<br>Responsabilidad tributaria: Regimen:<br>&Cual?:<br><!-- End of picture text -->



<!-- Start of picture text -->
<logo> al<br><ubicacién><br><alumnos> <titulo seccién> <Crear usuario para Cambiar<br>(Ajustes) nuevo empleado> credencialesadministrador>a3 de<br>Nombre completo: ID:<br>Contrasefia: Repetir contrasefia:<br>Cargo: Permisos:<br>Fotografia:<br>/o | 0<br><!-- End of picture text -->



<!-- Start of picture text -->
<logo> jal<br><ubicacién><br><alumnos> <titulo seccién> <Crear usuario para Cambiar<br>(Ajustes) nuevo empleado>P Sabinaadministrador>satan<br>Nuevo correo: Repetir nuevo correo:<br>Nueva contrasefia: Repetir nueva contrasefia:<br>Nota: su sesién se mantendra abierta con las credenciales predeterminadas mientras usted confirma mediante el<br>link enviado al nuevo correo el cambio de credenciales. Es importante que haga este proceso antes de realizar<br>una integracién completa con su negocio en la herramienta.<br><!-- End of picture text -->



<!-- Start of picture text -->
<nombre escuela><br><logo> jal<br>Nombre: Daniel Felipe SernaLépez 7<br>ID: 1116278383<br><cursos> .<br>Rol: Administrador<br>——_<br><ajustes> | <ayuda><br><!-- End of picture text -->



<!-- Start of picture text -->
<logo> fal<br>Nueyateoniraaetia: Nombre: Daniel Felipe Serna Lépez 7<br>Po to rr 270889<br><cursos> 2<br>Repetir nueva contrasefia: Rol: Administrador<br><pagos> Po<br><!-- End of picture text -->



<!-- Start of picture text -->
<logo> al<br>Nuevo ID: Nombre: Daniel Felipe Serna Lopez Z<br>P|) 10 1118278383<br>< ><br>Repetir nuevo ID: Rol: Administrador<br>ENVIAR CORREO DE CONFIRMACION CAMBIAR ID<br><!-- End of picture text -->



<!-- Start of picture text -->
<logo> jal<br>SOPORTE<br>Si es usted un empleado, por favor<br>contacte al administrador mediante el<br>botdén de abajo.<br>Si es usted el administrador, y tiene<br>problemas con la aplicaci6n, por<br>favor, pongase en contacto con el<br>desarrollador mediante el botén de<br>abajo.<br>DEV SUPPORT | ADMIN<br><!-- End of picture text -->



<!-- Start of picture text -->
<MATRICULA ESTUDIANTE NUEVO><br>Nombres: Curso al que se quiere matricular:<br>Apellidos: Periodos disponibles:<br>Correo electronico: Repetir correo electronico:<br>Fecha de nacimiento: Cédula:<br>Nota: al realizar el registro, y pagar de forma fisica, tiene un margen de 7 dias para<br>realizar el pago en la sede mas cercana. Recuerde pagar 3 dias antes de que comience el<br>nuevo periodo disponible.<br><REGISTRARSE, Y PAGAR DE <REGISTRARSE, Y CONTINUAR CON<br>FORMA FISICA> EL PAGO ONLINE><br><!-- End of picture text -->



<!-- Start of picture text -->
<nombre escuela><br><logo> A<br><ubicacién><br><alumnos> NOTIFICACIONES<br>Asunto: se requiere asistencia<br><cursos> Remitente: Claudia Lopez.<br>Asunto: falla en el pago de un usuario.<br>Remitente: Jose Gomez<br><pagos><br><ajustes> | <ayuda><br><salir><br><!-- End of picture text -->



<!-- Start of picture text -->
rp) Powdur, TEST MODE @‘ Pay<br>Shipping information<br>A Pure set $65.00 Emai<br>; =<br>= Pure2 glow cream $64.00 Shipping address<br>Name<br>Subtotal $129.00<br>United States. M<br>Address<br>Temkdue $134.00 Payment details<br>Card information<br>234 1234 1234 1234 wise (MES035<br>MM / YY ae 4<br>= Pay $134.00<br><!-- End of picture text -->



<!-- Start of picture text -->
PLANTILLA EJS a<br>USUARIO<br>PLANTILLA EJS<br><!-- End of picture text -->



<!-- Start of picture text -->
:<br>PETICION HTTP VERIFICADA <%= Etiqueta EUS 90> | |<br>API<br><%=EtiquetaEJS%>[| [|<br>se etawaa cis 7<br>USUARIO <%= Etiqueta EJS %> ee<br><!-- End of picture text -->

52 

# **Desarrollo Backend** 

En el desarrollo del backend de la aplicación, se va a hacer uso no solo de tecnologías 

modernas como Node.js, sino, de conceptos de seguridad avanzados, para mantener los 

estandares de seguridad internacional. También, se va a hacer uso de esquemas de funcionalidad 

que busquen la eficiencia, y la trasavilidad de datos, sin que el usuario lo note, como por 

ejemplo, haciendo uso de los eventos de Node.js, o herramientas de Linux para la automatización de tareas. 

# **Base de datos** 

Las tecnologías que van a girar en torno a la base de datos, van a estar implicadas en 3 

niveles: 

1. A nivel de modelado de entidades, siendo aquí que se utiliza **Mongoose** . 

2. A nivel de peticiones, siendo aquí que se utiliza meramente **MongoDB** . 

3. A nivel de almacenamiento, y administración, para lo cual voy a utilizar **MongoDB** 

# **Atlas** , y **MongoDB Compass** . 

53 

# **Modelado de Entidades, Restricciones, Relaciones y Funciones** 

# **_User_** 

**Archivo:** src/models/User.js 

**Colección:** users 

# **Campos, y restricciones** 

- **Email:** String, obligatorio, ÚNICO, minúsculas, sin espacios, debe cumplir formato de 

email (expresión regular). 

- **Password:** String, obligatorio, mínimo 8 caracteres. NUNCA se guarda en texto plano 

(Ver sección “Seguridad: BCRYPT, JWT y SESIONES”). 

- **Nombre:** String, obligatorio. 

- **Rol:** String, solo puede ser: 'admin', 'empleado'. Por defecto 'empleado. 

- **RefreshToken:** String, por defecto null. Guarda el HASH bcrypt del refresh token JWT 

actual. Es lo que mantiene activa la sesión (Ver sección “Seguridad: BCRYPT, JWT y SESIONES”). 

- **Activo:** Boolean, por defecto true. Permite borrado lógico. 

- **Timestamps:** createdAt / updatedAt automáticos. 

# **Relaciones** 

Ninguna directa, es una entidad independiente. 

# **Funciones de instancia** 

- **compararPassword(textoPlano):** true/false usando bcrypt.compare. 

- **guardarRefreshToken(hash):** guarda el hash del refresh token (login). 

- **limpiarRefreshToken():** lo borra: CIERRA la sesión (logout). 

- **actualizarDatos({nombre, email, rol}):** edita validando email único. 

54 

- **cambiarCredenciales({nuevoEmail, nuevaPassword}):** cambio de credenciales del 

admin (la contraseña se re-hashea sola en el pre-save). 

- **desactivar():** borrado lógico (activo = false). 

- **toJSON():** devuelve el usuario SIN password NI refreshToken. 

# **Funciones estáticas** 

- **buscarPorEmail(email):** para el login (incluye campos sensibles). 

- **buscarPorIdSeguro(id):** sin password ni refreshToken. 

- **listarEmpleados():** todos los usuarios activos. 

- **obtenerEmpleadoPorId(id):** uno activo o error 404. 

- **obtenerDocumentoActivo(id):** documento completo para editar, o 404. 

- **existeEmail(email, excluirId)** : verifica unicidad. 

- **crearEmpleado(datos):** crea validando email único (400 si repite). 

55 

# **_Estudiante_** 

**Archivo:** src/models/Estudiante.js 

**Colección:** estudiantes 

# **Campos, y restricciones** 

- **nombre:** String, obligatorio. 

- **apellido:** String, obligatorio. 

- **cedula:** String, obligatorio, ÚNICO, solo números (match /^\d+$/). 

- **email:** String, opcional; si viene debe ser email válido. 

- **telefono:** String, opcional. 

- **fechaNacimiento:** Date, opcional. 

- **direccion:** String, opcional. 

- **timestamps:** createdAt / updatedAt automáticos. 

# **Relaciones** 

Es referenciado por **Matricula** (Una matricula →un estudiante). 

# **Funciones de instancia** 

- **actualizarDatos(datos):** edita validando que la nueva cédula no exista. 

- **eliminar():** borrado FÍSICO, pero SOLO si el estudiante no tiene matrículas activas. 

# **Funciones estáticas** 

- **listar({page, limit, cedula}):** paginación + búsqueda por cédula. Devuelve { estudiantes, 

total, pages, currentPage }. 

- **obtenerPorId(id):** uno o error 404. 

- **existeCedula(cedula, excluirId):** verifica unicidad. 

- **crearNuevo(datos):** crea validando cédula única (400 si repite) **.** 

56 

# **_Curso_** 

**Archivo:** src/models/Curso.js 

# **Colección:** cursos 

# **Campos, y restricciones** 

- **nombre:** String, obligatorio. 

- **descripcion:** String, opcional. 

- **precio:** Number, obligatorio, no puede ser negativo (min 0). 

- **duracion:** String, obligatorio (ej: "4 semanas"). 

- **activo:** Boolean, por defecto true (borrado lógico). 

- **timestamps:** automáticos. 

# **Relaciones** 

Es referenciado por **Matricula** . Su precio determina el **saldoPendiente** inicial de cada 

matricula. 

# **Funciones de instancia** 

- **actualizarDatos(datos):** edición simple. 

- **desactivar():** borrado lógico. 

# **Funciones estáticas** 

- **listarActivos():** solo cursos activos. 

- **obtenerActivoPorId(id):** uno activo o error 404. 

- **crearNuevo(datos):** creación. 

57 

# **_Aula_** 

**Archivo:** src/models/Aula.js 

# **Colección:** aulas 

# **Campos, y restricciones** 

- **numero:** String, obligatorio, ÚNICO (ej: "A01"). 

- **capacidad:** Number, obligatorio, mínimo 1. 

- **ubicacion:** String, opcional. 

- **activo:** Boolean, por defecto true (borrado lógico). 

- **Timestamps:** automáticos. 

# **Relaciones** 

Es referenciado por **Matricula.** 

# **Funciones de Instancia** 

- **obtenerPoblacionActual()** : cuenta las matrículas ACTIVAS del aula en tiempo real (no se guarda un contador, se calcula siempre). 

- **tieneCupoDisponible()** : poblacionActual < capacidad. 

- **actualizarDatos(datos)** : edita; 400 si el número queda duplicado. 

- **desactivar()** : borrado lógico. 

# **Funciones estáticas** 

- **listarActivasConPoblacion():** aulas activas + poblacionActual calculada. 

- **obtenerActivaConPoblacion(id):** una aula + su población, o 404. 

- **obtenerActivaPorId(id):** documento activo o 404. 

- **crearNueva(datos):** crea; 400 "Ya existe un aula con ese número". 

58 

# **_Matricula (entidad central)_** 

**Archivo:** src/models/Matricula.js 

**Colección:** matricula 

# **Campos, y restricciones** 

- **estudiante:** ObjectId →ref ' **Estudiante** ', obligatorio. 

- **curso:** ObjectId →ref ' **Curso** ', obligatorio. 

- **aula:** ObjectId →ref ' **Aula** ', obligatorio. 

- **fechaInicio:** Date, por defecto hoy. 

- **fechaVencimiento:** Date, por defecto hoy + 7 días (plazo para pagar). 

- **estado:** String, solo: 'activa', 'vencida', 'moroso', 'cancelada'. Por defecto 'activa'. Es la base de la semaforización. 

- **pagos[]:** Subdocumentos embebidos: 

   - **monto:** Number obligatorio, no negativo. 

   - **fecha:** Date, por defecto ahora. 

   - **metodo:** solo 'fisico' o 'stripe'. 

   - **stripePaymentId:** String opcional. 

- **totalPagado:** Number, por defecto 0. 

- **saldoPendiente:** Number, por defecto 0. 

- **timestamps:** automáticos. 

# **Restricción especial** 

Índice compuesto ÚNICO (estudiante + curso): impide que un estudiante se matricule dos 

veces en el mismo curso a nivel de base de datos. 

59 

# **Hook (Pre-save)** 

- **Al crear:** saldoPendiente = precio del curso. 

- **Al actualizar:** saldoPendiente = max(0, precio - totalPagado). Siempre se recalcula desde 

el precio, nunca con restas sucesivas (evita errores de redondeo/acumulación). 

# **Funciones de instancia** 

- **agregarPago(monto, metodo, stripePaymentId):** agrega al array de pagos, recalcula totalPagado y saldoPendiente, y si el saldo llega a 0 deja el estado en 'activa'. 

- **recalcularTotales():** rehace las cuentas desde cero (lo usa el script npm run arreglarsaldos para corregir inconsistencias). 

- **verificarVencimiento():** si hoy > fechaVencimiento y hay saldo, pasa el estado a 'moroso'. Se aplica al listar matrículas. 

- **cambiarEstado(estado):** solo acepta valores del enum (400 si no). 

- **cancelar():** estado 'cancelada' (borrado lógico). 

# **Funciones estáticas** 

- **listarConDetalles():** todas, con estudiante/curso/aula populados, aplicando 

verificarVencimiento() a cada una (semaforización en vivo). 

- **obtenerDetallePorId(id):** una con todas las relaciones, o 404. 

- **crearNueva({estudianteId, cursoId, aulaId}):** aplica las REGLAS DE NEGOCIO: 

   - a. el estudiante debe existir (404), 

   - b. el curso debe existir y estar activo (404), 

   - c. el estudiante no debe tener otra matrícula activa (400), 

   - d. el aula debe existir, estar activa y tener cupo (400 "llena"). 

60 

- **migrarAula(matriculaId, nuevoAulaId):** mueve al estudiante de aula validando que el 

aula destino exista y tenga cupo (400/404 si no). 

# **_Configuración_** 

**Archivo:** src/models/Configuración.js 

**Colección:** configuración 

# **Campos, y restricciones** 

- **clave:** String, obligatorio, ÚNICO, por defecto 'general' (patrón singleton: solo existe UN documento general). 

- **nombreInstitucion String:** por defecto 'Motos BSA la 23'. 

- **ubicacion:** String, por defecto 'Tuluá, Valle del Cauca'. 

- **nit:** String, por defecto '900.123.456-7'. 

- **telefono, email:** Strings opcionales. 

- **colorPrimario:** String, por defecto '#0d6efd' (personaliza la interfaz). 

- **logoEmoji:** String. 

- **facturacion:** Subdocumento: 

   - prefijoFactura (defecto 'FAC') 

   - regimen (defecto 'Simplificado') 

   - resolucionDIAN (opcional) 

   - pieFactura (defecto 'Gracias por su pago') 

- **timestamps:** automáticos. 

# **Relaciones** 

Ninguna, está entidad solo es leída por las facturas PDF, y la interfaz. 



<!-- Start of picture text -->
SteeSeay [eiease | a cso EteEeleolie<br>Ee ‘suing rome | | ees<br>Ea a ‘wamser [orc | ee<br>som acmeeer | ‘suing avocon |<br>tie | ios _| “incluye (1:n)" ; cma | | |<br>C)<br>ESTUDIANTE ria Ricder Neen]<br>Objectid<br>SES SS<br>an a QYoate [tec<br>sere | sng |esato| sting [metoto |<br>stripePaymentld<br><!-- End of picture text -->

62 

# **Seguridad** 

La seguridad dentro del backend, se basa en 3 apartados: 

1. Hasheo de contraseñas, y tokens. 

2. Inicio de sesión con rotación de tokens. 

3. RBAC. 

# **_Hasheo de contraseñas_** 

Los datos que se protegen por medio de la encriptación utilizando **BCRYPT.JS** , son los 

siguientes 

1. User.password 

   - a. Se hashea automáticamente en el hook pre('save') del modelo User cada vez que 

la contraseña se crea o cambia. 

   - b. Nunca se almacena ni se devuelve en texto plano. 

   - c. El login la verifica con compararPassword() (bcrypt.compare). 

2. User.refreshToken 

   - a. El refresh token JWT se guarda HASHEADO con bcrypt en la base de datos 

   - b. (authService.generarSesion). 

   - c. Así, aunque alguien robe la base de datos, no puede usar los tokens para suplantar 

sesiones: solo tiene hashes, no tokens utilizables. 

**Campos que NO usan bcrypt** : ningún otro. Los datos de estudiantes, cursos, aulas y 

matrículas no son secretos criptográficos; se protegen con autenticación y roles, no con hash. 

63 

# **_Inicio de sesión con rotación de tokens_** 

La entidad USER, a través de su campo refreshToken, combinada con DOS tokens JWT firmados con secretos distintos (src/config/jwt.js) son los que mantienen la sesión abierta utilizando rotación de tokens. 

- **accessToken:** dura 15 minutos. Identifica al usuario en cada petición. Contiene: id, email, rol. Firma: JWT_SECRET. 

- **refreshToken:** dura 7 días. Sirve para renovar el accessToken sin volver a pedir 

- contraseña. Firma: JWT_REFRESH_SECRET. 

Ambos viajan en cookies httpOnly, inaccesibles para JavaScript del navegador → 

protección contra XSS. (Ver sección “Comunicación, y conexión de tecnologías”).. 

# **Ciclo de vida de la sesión:** 

- **LOGIN:** authService.login() valida credenciales, genera los 2 tokens, guarda 

bcrypt(refreshToken) en User.refreshToken y fija cookies. 

- **USO:** authMiddleware verifica el accessToken en cada petición. 

- **EXPIRA:** si el accessToken expiró, el middleware intenta renovarlo automáticamente con el refreshToken (refresh silencioso: el usuario ni se entera). 

- **REFRESH:** POST /api/auth/refresh: verifica firma del refresh token Y que coincida (bcrypt.compare) con el hash guardado en User. Genera un par de tokens NUEVOS 

   - (rotación: el viejo queda inválido) y actualiza el hash en la DB. 

- **LOGOUT:** authService.cerrarSesion() pone User.refreshToken = null: la sesión muere 

en el servidor y no se puede renovar más. Las cookies se limpian en el navegador. 

64 

# **_RBAC_** 

Los roles que se van a utilizar son: 

- **admin:** todo: empleados, configuración, credenciales, cursos, aulas, estudiantes, 

matrículas, pagos, facturas. 

- **empleado:** operación diaria: ver listados, registrar pagos, ver vistas. 

65 

# **Validaciones** 

SchoolNode valida DOS veces: a la entrada (HTTP) y en la base de datos. 

# **CAPA 1 — express-validator (en las RUTAS, antes de tocar la DB):** 

- Rechaza peticiones mal formadas con 400 y un array "errores". 

- El middleware validarCampos centraliza la respuesta (antes se repetía el mismo bloque en cada controlador). 

- Reglas por endpoint: 

   - login: email válido + password presente. 

   - estudiantes: nombre/apellido/cédula obligatorios; cédula solo números; email y 

fechaNacimiento válidos si vienen. 

      - cursos: nombre, precio >= 0, duración. 

      - aulas: número, capacidad entera >= 1. 

      - empleados: email válido, password mínimo 8, rol admin/empleado. 

      - matrículas y pagos: los IDs deben ser ObjectId válidos (isMongoId); el monto debe ser mayor a 0. 

      - TODOS los :id de la URL se validan con isMongoId (antes un id malformado llegaba hasta Mongoose y explotaba como 500). 

- Las rutas PUT (edición) también validan: antes no lo hacían y se podía guardar basura 

   - (ej: precio negativo por edición). Ahora los campos son opcionales pero, si vienen, deben 

ser válidos. 

# **CAPA 2 — Mongoose (en los ESQUEMAS, última línea de defensa):** 

1. required, unique, enum, min, minlength y match con mensajes en español. 

66 

2. Aunque algo se escape de express-validator (o se use el modelo desde un script como el 

   - seed), la base de datos sigue protegida. 

3. Ejemplos: cédula solo dígitos, email con formato, capacidad >= 1, precio >= 0, estados de 

   - matrícula dentro del enum. 

Además, los modelos traducen el error 11000 de MongoDB (llave duplicada) a mensajes 

claros: "Cédula ya registrada", "Email ya registrado", "Ya existe un aula con ese número". 

67 

# **Referencias Bibliográficas** 

**Arias Ortiz, E., Eusebio, J., Pérez Alfaro, M., Vásquez, M., & Zoido, P.** (2021, julio). _Los_ 

_Sistemas de Información y Gestión Educativa (SIGED) de América Latina y el Caribe: la ruta hacia la transformación digital de la gestión educativa_ . Iadb.org. 

<u>https://publications.iadb.org/es/los-sistemas-de-informacion-y-gestion-educativa-siged-</u> 

<u>de-america-latina-y-el-caribe-la-ruta-hacia</u> 

**Ferraiolo, D. F., Sandhu, R., Gavrila, S., Kuhn, D. R., & Chandramouli, R.** (2001). 

_Proposed NIST standard for role-based access control_ . ACM Transactions on 

Information and System Security (TISSEC), 4(3), 224-274. 

<u>https://doi.org/10.1145/501978.501980</u> 

**Fowler, M.** (2002). _Patterns of Enterprise Application Architecture_ . Addison-Wesley Professional. 

**Jones, M., Bradley, J., & Sakimura, N.** (2015). _JSON Web Token (JWT)_ . Internet Engineering 

Task Force (IETF). <u>https://datatracker.ietf.org/doc/html/rfc7519</u> 

**Mell, P., & Grance, T.** (2011). _The NIST definition of cloud computing_ . National Institute of Standards and Technology (NIST), Special Publication 800-145. 

<u>https://doi.org/10.6028/NIST.SP.800-145</u> 

**MongoDB Management Software.** (2024). _The MongoDB 7.0 Manual_ . 

<u>https://www.mongodb.com/docs/manual/</u> 

**Mozilla Developer Network (MDN).** (2023). _Express/Node introduction_ . MDN Web Docs. 

<u>https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Introduction</u> 

68 

**Nayak, A., Poriya, A., & Poojary, D.** (2013). _Type of NOSQL Databases and its Comparison_ 

_with Relational Databases_ . International Journal of Applied Information Systems, 5(4), 16-19. 

**Node.js Foundation.** (2024). _Node.js v20.x Documentation_ . <u>https://nodejs.org/api/</u> 

**OpenJS Foundation.** (2024). _Using middleware_ . Documentación oficial de Express.js. <u>https://expressjs.com/en/guide/using-middleware.html</u> 

**OWASP Foundation.** (2021). _Top 10:2021 The Ten Most Critical Web Application Security Risks_ . https://owasp.org/www-project-top-ten/ 

- **PCI Security Standards Council.** (2022). _Payment Card Industry Data Security Standard (PCI DSS) Requirements and Testing Procedures_ . Documentación oficial PCI SSC. 

<u>https://www.pcisecuritystandards.org/</u> 

- **Ramos Diaz, K. J., & Espinosa Sarmiento, A. G.** (2026, abril 17). _Modelo de gestión_ 

   - _Financiera digital para el sector educativo privado en Chía, Colombia, basado en las tendencias de consumo digital, 2025_ . Edu.co. 

<u>https://repositorio.ucundinamarca.edu.co/items/fecbcb2d-a399-4a9b-a62e-7dfa481f78f2</u> 

- **Rios Zuñiga, M. J., & Ysmodes Rios, A. R.** (2024). _Implementación de un sistema de_ 

   - _matrícula digital con automatización de los procesos para la asignación de vacantes en AWS para el Ministerio de Educación_ . Universidad Peruana de Ciencias Aplicadas (UPC). 

- **Souppaya, M., Morello, J., & Scarfone, K.** (2017). _Application container security guide_ . National Institute of Standards and Technology (NIST), Special Publication 800-190. 

<u>https://doi.org/10.6028/NIST.SP.800-190</u> 

69 

**Stripe.** (2022). _The state of online checkouts_ . <u>https://stripe.com/es-us/guides/state-of-north-</u> 

<u>american-checkouts-2022</u> 

**Stripe.** (2024). _Webhooks en Stripe: Referencia y mejores prácticas_ . Stripe API Documentation. 

<u>https://stripe.com/docs/webhooks</u> 

**Tilkov, S., & Vinoski, S.** (2010). _Node.js: Using JavaScript to Build High-Performance_ 

- _Network Programs_ . IEEE Internet Computing, 14(6), 80-83. 

<u>https://doi.org/10.1109/MIC.2010.145</u> 

70 

# **Apéndices** 

# **¿Qué es el centro de enseñanzas la 23?** 

Se trata de un genuino taller de motocicletas, y central de repuestos, que tiene una 

trayectoria de al rededor de 20 años, en donde se ha podido establecer varios enlaces 

institucionales para realizar practicas con instituciones como el SENA, UCEVA, y CESTELCO. 

Además, cuenta con un apartado privado que refuerza la enseñanza en practicas. 

j 

: 

. 

z 

. 

## ACTA DE AUTORIZACION Y CONSENTIMIENTO PARA PROYECTO ACADEMICO 

Ciudad y Fecha: Tulud, Valle del Cauca, alos }4_ dias del mes de_ Mca 40 de 202<sup>G.</sup> 

### - ENTRE LOS SUSCRITOS: 

: 

Por una parte, Daniel Felipe Serna Lépez, identificado con C.C. 1116278383, estudiante de tiltimo aito del” programa de Ingenieria de Sistemas de la Universidad Nacional Abierta y a Distancia (UNAD), quien en adelante se denominara EL ESTUDIANTE. . Por otra parte, AY \ sclue ) Sex NO { IQ ( JE. , identificado con C.C. [G3SASS53, en calidad de Representante Legal / Director de la institucién, Nom) BSA LA 23 (NIT: 16394553 -1 ), quien en adelante se denominara LA INSTITUCION. 

### ACUERDAN LO SIGUIENTE: 

PRIMERO. Objeto: LA INSTITUCION autoriza a EL ESTUDIANTE a implementar y validar su proyecto aplicado de grado titulado "SchoolNode", el cual consiste en una aplicacién web para la automatizacion de matriculas y pagos, en un entorno totalmente acadeiico, y simulado, 

SEGUNDO. Uso de Identidad Visual: LA INSTITUCION autoriza a EL ESTUDIANTEa utilizar su nombre, logotipo y colores corporativos de manera exclusiva para el.disefio de la interfaz de la aplicacién, con el fin de mantener el look and feel de la marca. Esta autorizaci6n esta limitada estrictamente a el entorno de esta plataforma, y no sera utilizada para otros fines. . ' TERCERO, Naturaleza Académica y Gratuidad: Ambas partes declaran expresamente que este acuerdo es de caracter estrictamente académico y no vinculante laboralmente. El desarrollo, implementacién y uso de la plataforma no generara ningtin tipo de cobro, tarifa o remuneracién econdmica por parte de EL i F ESTUDIANTE hacia LA INSTITUCION, ni viceversa. : ‘ 

CUARTO. Ausencia de Fines de Lucero: EL ESTUDIANTE declara que el software desarrollado es de naturaleza Open Source (Cédigo Abierto) y que no se lucraré econédmicamente con la comercializacién de la plataforma desarrollada para su proyecto de grado, ni utilizara la informacion alli alojada para fines comerciales, publicitarios o de venta a terceros. 



: 

QUINTO. Responsabilidad final del proyecto: LA INSTITUCION comprende que al ser un proyecto académico, EL ESTUDIANTE entrega el cédigo y la herramienta configurada hacia un repositorio academico, en donde perdurara indefinidamente como demostraci6n tecnica de su proyecto de grado, 

Para constancia, se firma el presente documento en dos (2) copias del mismo tenor. 



<!-- Start of picture text -->
FIRMAS: \ Ours (UA.%<br>Daniel Felipe Serna Lopez C.C. 1116278383 Representante institucional Cc. 1605A S53<br>.\.A<br>_<br>o™~ Uy Be,<br>Estudiante Ingenieria de Sistemas - UNAD Vasey4 pre<br>. Xs ay<br><!-- End of picture text -->

