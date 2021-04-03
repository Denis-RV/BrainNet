# CREATE TABLE
*необходимо знать* [[Constraint type]]
*теги:* #базы_данных, #sql/command/DBddl 
*описание:* создание таблиц.

---

## Шаблон
>CREATE TABLE `schema.`table `ORGANIZATION HEP`
>(column_name datatype `DEFAULT expr,
>column_name datatype default expr, ...`);


`schema` используется, если в хотите создать таблицы от имени других user-ов.
`heap` - куча. В таких таблицах нет сортировки при хранении.
`DEFAULT` - значения по умолчанию.

Каждый столбец должен иметь определенный тип [[Типы данных SQL]], 
и ограничения (constraint-ы).

**Пример:**
```sql
create table students (
student_id integer,
name varchar2(15),
start_date date DEFAULT round(sysdate),
scholarship number(6,2),
avg_score number(4,2) default 2
);
```

## Создание таблиц с помощью subquery
**Шаблон:**
>CREATE TABLE `schema.`table
>AS
>subquery;

**Для копирования структуры таблицы (без содержимого) мы можем написать условие, которое никогда не будет удовлетворено:**
```sql
create table regions as (select * from regions where 1=2);
```

**Пример создания и заполнения таблицы, которая частично являетвся копией другой таблицы:**
```sql
CREATE TABLE new_emps2 as (select EMPLOYEE_ID, FIRST_NAME, LAST_NAME, salary, DEPARTMENT_ID from EMPLOYEES);
```

**Более сложный пример:**
```sql
create table NEW_DEP as (select DEPARTMENT_NAME, MAX(SALARY) as MAX_XALARY, MIN(SALARY) as MIN_SALARY
                             from EMPLOYEES E
                                      join DEPARTMENTS D
                                           on (E.DEPARTMENT_ID = D.DEPARTMENT_ID)
                             group by DEPARTMENT_NAME);
```
