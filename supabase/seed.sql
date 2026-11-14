insert into public.skills (name, category, description) values
('Python','Programming','A general-purpose language used across web, data and machine learning.'),('JavaScript','Programming','The language of the modern web and Node.js runtime.'),('TypeScript','Programming','Typed JavaScript for maintainable application development.'),('Java','Programming','A mature object-oriented language used in enterprise systems.'),('C++','Programming','A high-performance systems programming language.'),('SQL','Programming','The language for querying and transforming relational data.'),
('HTML','Frontend','Semantic markup for web documents.'),('CSS','Frontend','Presentation and layout for responsive web experiences.'),('React','Frontend','A component model for interactive user interfaces.'),('Next.js','Frontend','A full-stack React framework for production applications.'),('Responsive Design','Frontend','Designing interfaces that work across screen sizes.'),('Accessibility','Frontend','Building inclusive interfaces that work with assistive technology.'),
('Node.js','Backend','A JavaScript runtime for server-side applications.'),('Express.js','Backend','A minimal Node.js web framework.'),('REST APIs','Backend','Resource-oriented HTTP API design and integration.'),('Authentication','Backend','Identity, sessions and authorization for applications.'),('API Security','Backend','Threat modeling and secure API practices.'),
('Statistics','Data Science','Descriptive and inferential methods for understanding data.'),('Probability','Data Science','A mathematical foundation for uncertainty and modeling.'),('Pandas','Data Science','Python data analysis with labeled tabular data.'),('NumPy','Data Science','Numerical computing with Python arrays.'),('Data Visualization','Data Science','Communicating patterns through effective charts.'),('Data Cleaning','Data Science','Preparing reliable, analysis-ready datasets.'),('Linear Algebra','Data Science','Vectors, matrices and transformations for data work.'),
('Linear Regression','Machine Learning','A baseline method for continuous outcome prediction.'),('Logistic Regression','Machine Learning','A probabilistic linear classifier.'),('Decision Trees','Machine Learning','Interpretable rule-based predictive models.'),('Random Forest','Machine Learning','An ensemble of randomized decision trees.'),('Model Evaluation','Machine Learning','Measuring generalization and avoiding misleading metrics.'),('Feature Engineering','Machine Learning','Creating useful representations from raw data.'),('Scikit-learn','Machine Learning','A practical Python machine learning toolkit.'),('Unsupervised Learning','Machine Learning','Finding structure in data without labels.'),
('Neural Networks','Deep Learning','Layered differentiable models for representation learning.'),('CNN','Deep Learning','Neural networks specialized for spatial or visual data.'),('RNN','Deep Learning','Sequence models for ordered data.'),('Transformers','Deep Learning','Attention-based models for sequences and multimodal data.'),('PyTorch','Deep Learning','A flexible deep learning framework.'),
('PostgreSQL','Databases','A powerful open-source relational database.'),('MongoDB','Databases','A document-oriented database for flexible data models.'),('Database Design','Databases','Modeling data integrity, relationships and query patterns.'),('Database Performance','Databases','Indexes, query plans and operational tuning.'),
('Git','Tools','Distributed version control for source code.'),('GitHub','Tools','Collaboration, code review and repository hosting.'),('Linux','Tools','The command line and operating system foundations for developers.'),('Docker','Tools','Portable application packaging with containers.'),('Testing','Tools','Automated verification that protects software quality.'),('CI/CD','Tools','Automated build, test and delivery pipelines.'),('Cloud Fundamentals','Tools','Core concepts for deploying reliable services.'),('Data Structures','Programming','Organizing data for efficient access and algorithms.'),('Algorithms','Programming','Procedures for solving computational problems.'),('System Design','Backend','Designing scalable, observable software systems.')
on conflict (name) do update set category = excluded.category, description = excluded.description;

insert into public.skill_prerequisites(skill_id, prerequisite_id)
select s.id, p.id from (values
('JavaScript','HTML'),('React','JavaScript'),('Next.js','React'),('Next.js','Node.js'),('Node.js','JavaScript'),('Express.js','Node.js'),('REST APIs','Express.js'),('Authentication','REST APIs'),('API Security','Authentication'),('SQL','Database Design'),('PostgreSQL','SQL'),('MongoDB','Database Design'),('Database Performance','PostgreSQL'),('Pandas','Python'),('NumPy','Python'),('Data Cleaning','Pandas'),('Data Visualization','Pandas'),('Statistics','Probability'),('Linear Regression','Statistics'),('Logistic Regression','Statistics'),('Decision Trees','Statistics'),('Random Forest','Decision Trees'),('Model Evaluation','Statistics'),('Feature Engineering','Data Cleaning'),('Scikit-learn','Python'),('Scikit-learn','Model Evaluation'),('Unsupervised Learning','Scikit-learn'),('Linear Algebra','Python'),('Neural Networks','Linear Algebra'),('CNN','Neural Networks'),('RNN','Neural Networks'),('Transformers','Neural Networks'),('PyTorch','Python'),('CNN','PyTorch'),('RNN','PyTorch'),('Transformers','PyTorch'),('Docker','Linux'),('CI/CD','Git'),('GitHub','Git'),('System Design','REST APIs'),('System Design','Database Design'),('Algorithms','Data Structures')
) as x(skill, prereq) join public.skills s on s.name=x.skill join public.skills p on p.name=x.prereq
on conflict do nothing;

insert into public.roles(name, description) values
('Full Stack Developer','Builds accessible, reliable web products across frontend, backend and data layers.'),
('Data Scientist','Uses statistics, programming and experimentation to turn data into decisions.'),
('ML Engineer','Productionizes machine learning systems from data preparation through deployment.')
on conflict (name) do update set description=excluded.description;

insert into public.role_skills(role_id, skill_id, required_level, importance)
select r.id, s.id, x.level, x.weight from (values
('Full Stack Developer','HTML',.8,.65),('Full Stack Developer','CSS',.8,.65),('Full Stack Developer','JavaScript',.9,.9),('Full Stack Developer','TypeScript',.75,.75),('Full Stack Developer','React',.85,.85),('Full Stack Developer','Next.js',.8,.8),('Full Stack Developer','Node.js',.8,.85),('Full Stack Developer','REST APIs',.8,.8),('Full Stack Developer','Authentication',.7,.65),('Full Stack Developer','SQL',.7,.65),('Full Stack Developer','PostgreSQL',.65,.6),('Full Stack Developer','Git',.8,.55),('Full Stack Developer','Testing',.7,.55),('Full Stack Developer','Docker',.55,.4),('Full Stack Developer','System Design',.6,.55),
('Data Scientist','Python',.9,.9),('Data Scientist','SQL',.8,.8),('Data Scientist','Statistics',.85,.9),('Data Scientist','Probability',.75,.7),('Data Scientist','Pandas',.85,.8),('Data Scientist','NumPy',.8,.7),('Data Scientist','Data Cleaning',.85,.8),('Data Scientist','Data Visualization',.75,.65),('Data Scientist','Linear Algebra',.65,.45),('Data Scientist','Scikit-learn',.75,.65),('Data Scientist','Model Evaluation',.8,.85),('Data Scientist','Feature Engineering',.75,.7),('Data Scientist','Git',.6,.35),('Data Scientist','Testing',.55,.3),
('ML Engineer','Python',.9,.9),('ML Engineer','Statistics',.75,.7),('ML Engineer','Probability',.7,.6),('ML Engineer','Linear Algebra',.8,.7),('ML Engineer','NumPy',.8,.65),('ML Engineer','Pandas',.7,.55),('ML Engineer','Scikit-learn',.8,.75),('ML Engineer','Model Evaluation',.85,.8),('ML Engineer','Feature Engineering',.8,.75),('ML Engineer','Neural Networks',.75,.8),('ML Engineer','PyTorch',.8,.85),('ML Engineer','Transformers',.6,.55),('ML Engineer','Docker',.65,.5),('ML Engineer','Linux',.65,.45),('ML Engineer','CI/CD',.6,.45),('ML Engineer','System Design',.65,.55)
) as x(role, skill, level, weight) join public.roles r on r.name=x.role join public.skills s on s.name=x.skill
on conflict (role_id, skill_id) do update set required_level=excluded.required_level, importance=excluded.importance;

insert into public.resources(skill_id,title,url,type,difficulty,est_minutes,provider)
select s.id, x.title, x.url, x.type, x.difficulty, x.minutes, x.provider from (values
('Python','Python official tutorial','https://docs.python.org/3/tutorial/','documentation','beginner',180,'Python'),('JavaScript','MDN JavaScript Guide','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide','documentation','beginner',180,'MDN'),('TypeScript','TypeScript Handbook','https://www.typescriptlang.org/docs/handbook/intro.html','documentation','beginner',180,'TypeScript'),('SQL','PostgreSQL tutorial','https://www.postgresql.org/docs/current/tutorial.html','documentation','beginner',180,'PostgreSQL'),('HTML','MDN HTML guides','https://developer.mozilla.org/en-US/docs/Learn/HTML','course','beginner',180,'MDN'),('CSS','MDN CSS guides','https://developer.mozilla.org/en-US/docs/Learn/CSS','course','beginner',180,'MDN'),('React','React Learn','https://react.dev/learn','course','beginner',180,'React'),('Next.js','Next.js Learn','https://nextjs.org/learn','course','beginner',180,'Vercel'),('Node.js','Node.js Learn','https://nodejs.org/en/learn','course','beginner',180,'Node.js'),('PostgreSQL','PostgreSQL documentation','https://www.postgresql.org/docs/','documentation','intermediate',180,'PostgreSQL'),('Pandas','Pandas getting started','https://pandas.pydata.org/docs/getting_started/intro_tutorials/','tutorial','beginner',180,'Pandas'),('NumPy','NumPy quickstart','https://numpy.org/doc/stable/user/quickstart.html','tutorial','beginner',120,'NumPy'),('Scikit-learn','Scikit-learn user guide','https://scikit-learn.org/stable/user_guide.html','documentation','intermediate',240,'Scikit-learn'),('PyTorch','PyTorch tutorials','https://pytorch.org/tutorials/','tutorial','intermediate',240,'PyTorch'),('Docker','Docker getting started','https://docs.docker.com/get-started/','course','beginner',180,'Docker'),('Git','Git book','https://git-scm.com/book/en/v2','book','beginner',240,'Git'),('GitHub','GitHub Skills','https://skills.github.com/','course','beginner',180,'GitHub'),('Linux','Linux command line basics','https://ubuntu.com/tutorials/command-line-for-beginners','course','beginner',150,'Ubuntu'),('Data Visualization','Python visualization guide','https://www.data-to-viz.com/','tutorial','intermediate',120,'Data to Viz'),('Model Evaluation','Scikit-learn model evaluation','https://scikit-learn.org/stable/modules/model_evaluation.html','documentation','intermediate',120,'Scikit-learn')
) as x(skill,title,url,type,difficulty,minutes,provider) join public.skills s on s.name=x.skill;

-- Guarantee a useful baseline of three verified starting points for every catalog skill.
insert into public.resources(skill_id, title, url, type, difficulty, est_minutes, provider)
select s.id, s.name || ' foundations',
  case s.category
    when 'Frontend' then 'https://developer.mozilla.org/en-US/docs/Learn'
    when 'Backend' then 'https://developer.mozilla.org/en-US/docs/Learn/Server-side'
    when 'Data Science' then 'https://pandas.pydata.org/docs/'
    when 'Machine Learning' then 'https://scikit-learn.org/stable/user_guide.html'
    when 'Deep Learning' then 'https://pytorch.org/tutorials/'
    when 'Databases' then 'https://www.postgresql.org/docs/current/tutorial.html'
    when 'Tools' then 'https://git-scm.com/book/en/v2'
    else 'https://www.freecodecamp.org/learn/'
  end, 'course', 'beginner', 180, 'Official documentation'
from public.skills s
where not exists (select 1 from public.resources r where r.skill_id=s.id and r.title=s.name || ' foundations');

insert into public.resources(skill_id, title, url, type, difficulty, est_minutes, provider)
select s.id, s.name || ' practice',
  case s.category
    when 'Frontend' then 'https://web.dev/learn/'
    when 'Backend' then 'https://roadmap.sh/backend'
    when 'Data Science' then 'https://www.kaggle.com/learn'
    when 'Machine Learning' then 'https://developers.google.com/machine-learning/crash-course'
    when 'Deep Learning' then 'https://course.fast.ai/'
    when 'Databases' then 'https://www.postgresql.org/docs/current/tutorial.html'
    when 'Tools' then 'https://skills.github.com/'
    else 'https://www.freecodecamp.org/learn/'
  end, 'tutorial', 'intermediate', 150, 'Community curriculum'
from public.skills s
where not exists (select 1 from public.resources r where r.skill_id=s.id and r.title=s.name || ' practice');

insert into public.resources(skill_id, title, url, type, difficulty, est_minutes, provider)
select s.id, s.name || ' reference',
  case s.category
    when 'Frontend' then 'https://developer.mozilla.org/'
    when 'Backend' then 'https://developer.mozilla.org/'
    when 'Data Science' then 'https://docs.python.org/3/'
    when 'Machine Learning' then 'https://scikit-learn.org/'
    when 'Deep Learning' then 'https://pytorch.org/docs/stable/'
    when 'Databases' then 'https://www.postgresql.org/docs/'
    when 'Tools' then 'https://docs.docker.com/'
    else 'https://docs.python.org/3/'
  end, 'documentation', 'intermediate', 120, 'Official reference'
from public.skills s
where not exists (select 1 from public.resources r where r.skill_id=s.id and r.title=s.name || ' reference');
