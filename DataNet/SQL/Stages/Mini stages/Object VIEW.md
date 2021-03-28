
# Object VIEW
*Need to know:* [[Database Objects]]
*tegs:* #sql 
*description:* ненастоящая таблица. Например это может быть таблица, которую мы сформируем с помощью select запроса. View тажке полезна, когда нам надо открыть доступ к определенной информации из таблицы. View подходит для представления сложных запросов обычным пользователям.

---


## Создание и просмотр View
шаблон:
> create `OR REPLACE {FORCE|NONFORCE}` view `schema.`view_name `(alias1, alias2, ...)` 
> AS subquery
> `WITH CHECK OPTION {CONSTRAINT constrain_tname}`
> `WITH CHECK ONLY {CONSTRAINT constraint_name}`

Простой пример:
```sql
create view fin_emp as
    select EMPLOYEE_ID, job_id, salary from EMPLOYEES;

select * from FIN_EMP;

create or replace view fin_emp2 as select * from STUDENTS;
```

`or replace` - если такой view уже существует, он будет пересоздан.

`Nonforce` - дефолтное значение.
`FORCE` создат view даже если вы используете таблицу, которой не существует.
`WISH CHECK OPTION` - view, в который нельзя добавлять значения, которые не будут добавляться в view, но будут добавляться в оригинальную таблицу. То есть без этого у нас может быть такая ситуация:
```sql
create view v202 as select * from STUDENTS where course > 2;
select * from v202;
insert into v202 values(7, 'Kate', 1, 2);
```
то есть при вставки 'Kate' она вставляется лишь в таблицу students, т.к. у нее course < 2 (3 значение).
При исполььзовании wish check option мы не сможем вставлять 'kate' в оригинальную таблицу.

`WITH CHECK ONLY` - view только для чтения

`CONSTRAINT` никак не относится к [[Constraint type]], для чего оно нужно, не знаю. Возможно это название ограничения для read only или with check.

`alias1, alias2` - позволяет задать названия всем столбцам из subquery
## Типы View
С simple view можно использовать команды для изменнеия, удаления и добавления элементов, а с complex view нельзя

### Simple View
- One table 
- No functions 
- No aggregation

*Изменяя эти таблицы вы также изменяете оригинальную таблицу.*

### Complex View
- Join tables
- Functions
- Aggregation

Для некоторых complex view может пройти операция удаления (но не добавление/изменение).
Напрмер для такой:
```sql
create view v105 as select substr(name, 2) name, COURSE from STUDENTS;
```
Чтобы удалить строку, нам ничего не мешает. Но oracle не знает, как вставить значение и одновременно передать это значение в оригинальную таблицу.

## Alter view
*Шаблон:*
>ALTER VIEW schema.view_name COMPILE;

```sql
create force view v18 as select name, LAST_NAME from STUDENTS;
alter table students add (last_name varchar2(15));
select * from v18;
```