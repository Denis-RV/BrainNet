ненастоящая таблица. Например это может быть таблица, которую мы сформируем с помощью select запроса. 

View тажке полезна, когда нам надо открыть доступ к определенной информации из таблицы.

Также View полезно для представления сложных запросов для обычных пользователей.

## Создание и просмотр View
шаблон:
> create view `schema.`view_name as
> select column(s)|* from `schema.`employees;

Простой пример:
```sql
create view fin_emp as
    select EMPLOYEE_ID, job_id, salary from EMPLOYEES;

select * from FIN_EMP;
```