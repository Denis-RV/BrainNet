# SELECT
*теги:* #базы_данных, #sql/command/DBdml.
*описание:* выборка из таблиц. SELECT - statement, то есть он не меняет данных.

---
# Шаблон
>SELECT \* | {`DISTINCT` column(s) `alias`, expression(s) `alias, group_f-on(s)(col|expr alias),`} 
>FROM table
>`WHERE conditions(s)`
>`GROUP BY` {`col(s)|expr(s)`}
>`HAVING group_condition(s)`
>`ORDER BY` {col(s) | expr(s) | numeric position}
>{`ASC`|`DESC`}{`NULLS FIRST`|`LAST`};

здесь `информативность` и ~~необязательный паремтр~~. | означает "или"

## Основные концепции
- `PROJECTION` - выбор столбцов из таблицы.
- `SELECTION` - выбор строк из таблицы.
-  `JOINING` - объединение таблиц.

# Projection

## Basic syntax
- выбрать все столбцы из таблицы table: 
	```sql
	SELECT * FROM table;
	```
	
- выбрать определенные столбы из таблицы: 
	```sql
	SELECT column(s) FROM table;

	--пример:
	select country_name, country_id from countries;
	```

- Выбор уникальных значений с помощью `DISTINCT`:
	```sql
	SELECT DISTINCT column(s) FROM table;
	
	--уникальная выборка из КОМБИНАЦИИ столбцов, то не будут выводиться 
	--только столбцы, у которых будут одинаковые значения в двух таблицах.
	SELECT DISTINCT job_id, department_id FROM job_history;
	```

## Expressions in select list
>SELECT column(s), expression(s) FROM table;

- Вывести зарплаты, умноженные на два.
```sql
SELECT salary*2 FROM employees;
```

В выражениямх мы можем использовать несколько столбцов.
- Вывод удвоенной зарплаты, суммируемой с id работника
```sql
SELECT salary*2+employee_id FROM employees;
```

- Вывод обычной зп и удвоенной:
```sql
select salary, salary*1.5 FROM employees;
```

### Арифметические операции
Доступные операции:
- \* - умножение
- \- - вычитание
- \+ - сложение
- \/ - деление

Можно использовать скобки `()` для обозначение приоритета:

```sql
select salary, salary*5/2/10-5, salary*5/2/(10-5) from employees;
```

### Expression with DATE
Мы можем складывать и вычитать даты и получать целые числа, либо прибавлять и вычитать из них даты и получать даты.

Например если нам надо узнать, сколько дней человек проработал:
```sql
SQL>  select salary, salary*5/2/10-5, salary*5/2/(10-5) from employees;

START_DAT END_DATE  END_DATE-START_DATE+1
--------- --------- ---------------------
13-JAN-01 24-JUL-06                  2019
21-SEP-97 27-OCT-01                  1498
28-OCT-01 15-MAR-05                  1235
17-FEB-04 19-DEC-07                  1402
24-MAR-06 31-DEC-07                   648
01-JAN-07 31-DEC-07                   365
17-SEP-95 17-JUN-01                  2101
24-MAR-06 31-DEC-06                   283
01-JAN-07 31-DEC-07                   365
01-JUL-02 31-DEC-06                  1645
```

### Concatenation (Конкатенация строк).
Конкатенация происходит с помощью `||`:
```sql
select first_name || last_name || phone_number from employees;
```

Конкатенация используется c любыми типами.

При конкатенации мы также можем использовать ==свои тектсовые фразы==, заключая их в одинарные кавычкки`''`:
```sql
select 'First name is '||first_name||' and last name is '
||last_name from employees;
```

NULL при конкатенации игнорируется.

### Alias
\- alias - это альтернативное имя для столбца или целого выражения.

>SELECT column(s) alias, expression(s) alias FROM table;

alias не обязательно писать. Чтобы изменить имя столбца, достаточно добавить его перед from:
```sql
SELECT first_name name from employees;

select first_name myname, last_name oldname from employees; 
```

Для читабельности мы можем добавить `as` перед именем:
```sql
SELECT first_name as name from employees;

select first_name AS myname, last_nam  e  oldname from employees; 
```

Если мы хотим сделать название, в котором есть пробелы, нам надо использовать двойные кавычки `""`. Это также позволяет делать назавния таблиц из маленьких букв:
```sql
SELECT first_name as "It is name" from employees;
```

### Макет-таблица dual
 Эта таблица состоит из одного столбца и одной строчки:
```sql
SQL> select * from dual;
D
-
X
```

### Управление регистром
Чтобы вывести содержимое строки в верхнем регистре, заключите название колонки в скобки и напишите перед ними LOWER:
```sql
select LOWER(job_id) from employees;

Эта таблица нужна для того, чтобы мы могли с ее помощью выводить некоторые свои выражения:
```sql
SQL> select 'abc'||'xyz'||(90*30) as express from dual;
EXPRESS
----------
abcxyz2700
 ```
 
### Проблема с одинарными ковычками
Чтобы вывести символ одинароной ковычки,есть два решения:
1. Нужно использовать две подряд:
 ```sql
 SQL> select 'it''s my life' from dual;
 Life
------------
it's my life
 ```
2. Использовать ==Quote (q) operator==:
>q'<наш текст с кавычками>'

```sql
SQL> select q'<it's my life>' as Life from dual;

LIFE
------------
it's my life
```


# Selection
## Приоеритеты операций
![[Pasted image 20210308003330.png]]
## Операторы сравнения 
- = - равно
- < - меньше
- > - больше
- <= - меньше или равно
- >= - больше или равно
- != - не равно
- <> - не равно
- `BEETWEEN` - интервал значений от и до.
	```sql
	select first_name, last_name, salary from employees
	where salary between employee_id+8900 and 10000;
	
	--означает:
	select first_name, last_name, salary from employees
	where salary between 4000 and 10000;
	```
- `IN (first_value, second value...)` - перечисляем значения
	```sql
	select * from departments where location_id in (1700, 2400, 1500);
	
	--означает
	select * from departments where location_id=1700 OR location_id=2400
	or location_id=1500;
	```
- `IS NULL` - null значения
- `IS NOT NULL` - не null значения
- `LIKE` - знак равенства, позволяющий использовать специальные символы. 
	- `%` - означает, что вместо % может быть любое количество любых символов. Например 'Be%' или '%s'. Регистр учитывается.
	```sql
	select * from employees where first_name like 'S%';
	```
	- `_` - означает любой ОДИН символ
	- `'\_' escape '\'` - делаем специальные символы обычными. Вместо \ можно использовать любой символ.

## Операторы логики
- AND - и, пересечение условий.
- OR - или, объединение условий.  (Приеритет ниже, чем у OR)
- NOT - не, меняет значение условия на противоположное 

Пример приоритетов:
```sql
first_name like '__n%' AND commission_pct is null
OR
first_name like 'A%' AND job_id = 'SA_REP';

--Эвивалент:

(first_name like '__n%' AND commission_pct is null)
OR
(first_name like 'A%' AND job_id = 'SA_REP');
```
## Выбор с условием
Выбор работников с зарплатой 17000:
```sql
SQL> select first_name, last_name, salary 
from employees 
where salary = 17000;

FIRST_NAME           LAST_NAME                     SALARY
-------------------- ------------------------- ----------
Neena                Kochhar                        17000
Lex                  De Haan                        17000
```

Выбор работников с именем King:
```sql
SQL> select first_name, last_name, salary
  2  from employees
  3  where last_name = 'King';

FIRST_NAME           LAST_NAME                     SALARY
-------------------- ------------------------- ----------
Janette              King                           10000
Steven               King                           2400
```
*Примечание: При сравнение имен, эти имена конвертируются в числовые значения, поэтому мы можем использовать операторы > и <. Имена сравниваются подобно тому, как они располагаются в словаре.*

Выбор даты:
```sql
select * from employees where hire_date='21.sep.05';
```
Иногда дата может организована иначе, и нужно вместо названия месяца писать номер месяца.

Сравнение столбцов:
```sql
select * from employees where employee_id-1 = manager_id;
```

==Текстовые значения, разного реестра - разные значения!==

Сравнение с конкатенацией:
```sql
SQL> select first_name, last_name from employees
  2  where first_name||' '||last_name='David Austin';

FIRST_NAME           LAST_NAME
-------------------- -------------------------
David                Austin
```





## ORDER BY сортировка
Сортировать можно по колонке или по колонкам, по выражениями и по порядковому номеру столбца в select-листе.

Сортировка происходит по значению (по возврастанию), по алфовиту (от A   до Z), по дате (От более ранней к поздней).


Сортировка по значению:
```sql
SQL> select first_name, salary from employees order by salary;

FIRST_NAME               SALARY
-------------------- ----------
TJ                         2100
Steven                     2200
Hazel                      2200
Karen                      2500
```

*`Order by` никак не влияет на количество выведенных строк.*

==Сориторвка по возвростанию== делается с помощью слова `DESC`

Сортировка по выражению с применениеп `alias`:
```sql
select last_name, salary, hire_date, hire_date+salary*2 EXPR
from employees
where employee_id>120
order by EXPR;
```

==NULLS FIRST|LAST==
Если мы сортируем по возврастанию строчки со значениями null, то по умолчанию строчки null будут идти в конце (`nulls first`). Чтобы это изменить, надо написать `NULLS LAST`.

**Сортировка по порядковому номеру в select-листе**
```sql
select first_name, salary from employees order by 2;

--Эвивалент:

select first_name, salary from employees order by salary;
```

Сортировка нескольких столбцов. В следующем примере сначала идет сортировка по job_id, если значения одинаковые, то происходит сортировка по last_name и т.д.
```sql
select job_id, first_name, last_name, salary, hire_date
from employees
order by job_id desc, last_name, 4 desc;
```
## GROUP BY группировка
**Group by позволяет сгруппировать значения строк определенной колонки**

В следующем примере мы групируем информацию по department_id и для каждой группы выводим количество строк.
```sql
select DEPARTMENT\_ID, count(\*) from EMPLOYEES group by DEPARTMENT\_ID  
order by 1;
```

Другие примеры:
```sql
select MAX(HIRE\_DATE)   as MAX\_, MIN(FIRST\_NAME) as MIN\_, COUNT(\*) as COUNT\_, ROUND(AVG(SALARY)) as AVG\_,  
 SUM(EMPLOYEE\_ID) as SUM\_  
    from EMPLOYEES  
    group by DEPARTMENT\_ID;  
  
select to\_char(HIRE\_DATE, 'yyyy Month'), count(\*) from EMPLOYEES  
group by to\_char(HIRE\_DATE, 'yyyy Month')  
order by to\_char(HIRE\_DATE, 'yyyy Month');
```

**Группировать можно и по нескольким столбикам:**
```sql
select DEPARTMENT_ID, job_id, count(*) from EMPLOYEES  
group by DEPARTMENT_ID, job_id order by DEPARTMENT_ID;
```

### Having
**Чтобы выводить информацию с использованием выборки по multiply-row функциям, необходимо использовать `HAVING`:**
```sql
select DEPARTMENT_ID, count(*)  
from EMPLOYEES  
HAVING count(*) > 3  
group by DEPARTMENT_ID
```
### Nested group
В отличие от nested single-row functions, функции group (multiple-row) имеют ограничение по вложенности - каждая group функция может иметь лишь одну вложенную функцию.  

Сумма средних зарплат кажого департамента:
```sql
select sum(round(avg(salary))) from EMPLOYEES group by DEPARTMENT_ID;
```

Зато можно комбинировать single-row и multiply-row:
```sql
select round(sum(avg(length(upper(last\_name))))) from EMPLOYEES group by DEPARTMENT\_ID;
```

# Joining
Есть несколько способов объединения таблиц:
- INNER JOIN (NATURAL JOIN) - объеднинение двух таблиц по критерию. 
- OUTER JOIN - объединение двух таблиц по од инаковому критерию + дополнительные строки, которые не удволетворяют этому критерию.
- CROSS JOIN
- EQUI JOIN
- NONEQUI JOIN
- ORACLE JOIN - фишка в Oracle sql, работает только в нем.


SQL позволяет объединить любые 2 таблицы, но рекомендуется
объединять столбики таблиц, которые логически должны представлять одно и то же. 

**Полное имя атрибутов и задание имени таблице**
При выводе колонок вы можете сначала писать название таблицы. Также можно задавать alias в конце таблицы, чтобы вместо настящего названия использовать псевдоним:
```sql
select employees.salary from employees;
select e.salary from employees e;
```

## INNER JOIN
### NATURAL JOIN
\- объединяет таблицы по столбцам с одинаковыми именами. В этом join-е нельзя выбирать критерии, по которым будет происходить объединение. При объединение таблиц без одинаковых столбцов все будет перемножено. Типы данных одинаковых имен, по которым будет происходить join, должны быть одинаковыми.

**Шаблон:**
>SELECT column(s)
>FROM table_1
>NATURAL JOIN
>table_2; 

*Примеры:*
```sql
select * from REGIONS NATURAL JOIN COUNTRIES;
 
select COUNTRY\_NAME, COUNTRY\_ID, REGION\_NAME, REGION\_ID  
 from REGIONS R  
 NATURAL JOIN COUNTRIES C;  
select C.COUNTRY\_NAME, C.COUNTRY\_ID, R.REGION\_NAME, REGION\_ID  
 from REGIONS R  
 NATURAL JOIN COUNTRIES C;  
  
select \* from EMPLOYEES where DEPARTMENT\_ID \= 90 and MANAGER\_ID \= 100;  
select \* from DEPARTMENTS;  
select FIRST\_NAME, LAST\_NAME, SALARY, DEPARTMENT\_NAME, DEPARTMENT\_ID, MANAGER\_ID  
 from EMPLOYEES  
             natural join DEPARTMENTS;
```

**Если обхединять таблицы, у которых 2 и более одинаковых столбцов, то будут выводиться только те строки, у которых совпадают 2 или более столбцов, остальные не будут выводиться.**
```sql
select 		* from EMPLOYEES natural join JOB_HISTORY; --одна строка
```

### JOIN with USING
\- с помощью этого join можно объединять таблицы с 2 одинаковыми столбцами по одному.

**Шаблон:**
>SELECT column(s)
>FROM table_1
>JOIN
>table_2
>USING (column(s));

**При объединение таблиц с несколькими одинаковыми столбцами, мы должны указывать, из какой таблицы будем использовать столбец, который в обоих таблицах одинаковый и который не используется для объединения:**
```sql
select FIRST_NAME, LAST_NAME, SALARY, DEPARTMENT_NAME, DEPARTMENT_ID, E.MANAGER_ID  
 from EMPLOYEES E join DEPARTMENTS D using (DEPARTMENT_ID);  
select FIRST_NAME, LAST_NAME, SALARY, DEPARTMENT_NAME, DEPARTMENT_ID, D.MANAGER_ID  
 from EMPLOYEES E join DEPARTMENTS D using (DEPARTMENT_ID);
 select FIRST_NAME, LAST_NAME, SALARY, DEPARTMENT_NAME, DEPARTMENT_ID, e.MANAGER_ID, d.MANAGER_ID  
 from EMPLOYEES e join DEPARTMENTS d using (department_id);
```
### JOIN ON
\- с помощью этого объединения можно объединять любые таблицы.

**Шаблон:**
>SELECT column(s)
>FROM table_1
>JOIN
>table_2
>USING (column1 = column2);

```sql
select FIRST_NAME, LAST_NAME, JH.JOB_ID, START_DATE, END_DATE, EMPLOYEES.EMPLOYEE_ID, JH.EMPLOYEE_ID
    from EMPLOYEES
             join JOB_HISTORY JH ON (EMPLOYEES.EMPLOYEE_ID = JH.EMPLOYEE_ID)

select * from REGIONS;
select * from DEPARTMENTS;
select *
    from DEPARTMENTS
             join REGIONS on
        (REGION_ID * 10 = DEPARTMENT_ID); 
```

Обединять можно и по нескольким столбцам:
```sql
select FIRST_NAME, LAST_NAME, JH.JOB_ID, START_DATE, END_DATE
    from EMPLOYEES e
        join JOB_HISTORY JH ON (e.EMPLOYEE_ID = jh.EMPLOYEE_ID AND e.DEPARTMENT_ID = jh.DEPARTMENT_ID)
```

## NONEQUI JOIN
\= как join with on, но с доп условиями.
**Шаблон:**
>SELECT column(s)
>FROM table_1
>JOIN
>table_2
>USING (column1 {оператор неравенства} column2);

```sql
select FIRST_NAME, salary, MIN_SALARY, MAX_SALARY
from EMPLOYEES e join jobs j on (e.JOB_ID = j.job_id AND salary*2<max_salary)
```

## SELF JOIN
\- объединение одной и той же таблицы с самой собой.

```sql
select E1.EMPLOYEE_ID, E1.FIRST_NAME, E1.MANAGER_ID, E2.FIRST_NAME as MANAGER_NAME
    from EMPLOYEES E1
             join EMPLOYEES E2 ON (E1.MANAGER_ID = E2.EMPLOYEE_ID);
```
## OUTER JOIN
\- в отличие от INNER JOIN может выводить строки, неудовлетоврящие заданному условию.

**Есть три вида outer join:**
- left outer join - сначала выводяться все строки, которые совпали с join у левой таблицы, затем те, которые не совпали.
- right outer join.
- full outer join - комбинация left и right.

```sql
 select FIRST_NAME, LAST_NAME, SALARY, DEPARTMENT_NAME
    from EMPLOYEES E
             join DEPARTMENTS D on (E.DEPARTMENT_ID = D.DEPARTMENT_ID);

select FIRST_NAME, LAST_NAME, SALARY, DEPARTMENT_NAME
    from EMPLOYEES E
             left outer join DEPARTMENTS D on (E.DEPARTMENT_ID = D.DEPARTMENT_ID);
-- equal
select FIRST_NAME, LAST_NAME, SALARY, DEPARTMENT_NAME
    from DEPARTMENTS D
             right outer join EMPLOYEES E using (DEPARTMENT_ID);

select FIRST_NAME, LAST_NAME, SALARY, DEPARTMENT_NAME
    from EMPLOYEES E
             full outer join DEPARTMENTS D on (E.DEPARTMENT_ID = D.DEPARTMENT_ID);


select FIRST_NAME, LAST_NAME, SALARY, DEPARTMENT_NAME
    from DEPARTMENTS D
             left outer join EMPLOYEES E on (E.DEPARTMENT_ID = D.DEPARTMENT_ID)
    where DEPARTMENT_NAME like '%i%';

select FIRST_NAME, LAST_NAME, SALARY, DEPARTMENT_NAME
    from EMPLOYEES E
             right outer join DEPARTMENTS D on (E.DEPARTMENT_ID = D.DEPARTMENT_ID)
    where DEPARTMENT_NAME like '%i%';

select DEPARTMENT_NAME, D.DEPARTMENT_ID, FIRST_NAME
    from DEPARTMENTS D
             left outer join EMPLOYEES E
                             on (E.DEPARTMENT_ID = D.DEPARTMENT_ID)
    where E.DEPARTMENT_ID is null;

select NVL(FIRST_NAME, 'no employee'), NVL(LAST_NAME, 'no employee'), NVL(SALARY, 0),
       NVL(DEPARTMENT_NAME, 'no department')
    from EMPLOYEES E
             full outer join DEPARTMENTS D on (E.DEPARTMENT_ID = D.DEPARTMENT_ID)
```

## CROSS JOIN
\- Обединяет каждую строку из 1 таблицы с каждой строкой 2 таблицы. Тот же самый эффект достигается, если делать natural join с таблицами без одинаковым столбиков.

**Шаблон:**
>SELECT column(s)
>FROM table_1
>CROSS JOIN
>table_2; 

```sql
select * from COUNTRIES;
select * from REGIONS;

select * from COUNTRIES cross join regions;

select * from COUNTRIES cross join regions where REGIONS.REGION_ID = 1;
``` 

## ORACLE JOIN

### Oracle inner join
**Шаблон:**
>SELECT column(s)
>FROM table_1 t1, table_2 t2
>Where t1.column1 = t2.column2;

```sql
from EMPLOYEES e, DEPARTMENTS d
where e.DEPARTMENT_ID = d.DEPARTMENT_ID;
```

### Oracle outer join
**Шаблон right:**
>SELECT column(s)
>FROM table_1 t1, table_2 t2
>Where t1.column1 (+) = t2.column2;

```sql
select FIRST_NAME, LAST_NAME, SALARY, e.DEPARTMENT_ID, DEPARTMENT_NAME
from EMPLOYEES e, DEPARTMENTS d
where e.DEPARTMENT_ID (+) = d.DEPARTMENT_ID;
```

**Шаблон left:**
>SELECT column(s)
>FROM table_1 t1, table_2 t2
>Where t1.column1 (+) = t2.column2;

```sql
select FIRST_NAME, LAST_NAME, SALARY, e.DEPARTMENT_ID, DEPARTMENT_NAME
from EMPLOYEES e, DEPARTMENTS d
where e.DEPARTMENT_ID  = d.DEPARTMENT_ID (+);
```

### Oracle cross join
**Шаблон:**
>SELECT column(s)
>FROM table_1 t1, table_2 t2;

