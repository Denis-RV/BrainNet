# SUBQUERY
*Need to know:* [[SELECT]]
*tegs:* #db #sql 

---
==SUBQUARY== позволяет использовать вложенные утверждения. Сначала всегда срабатывает внутренний запрос, только потом внешний.
```sql
select FIRST_NAME, LAST_NAME, SALARY
from EMPLOYEES where salary > (select avg(salary) from EMPLOYEES);
```

# SUBQUERУ with SELECT
Можно несколькими способами получить один и тот же результат:
```sql
select COUNT(*)
    from (select E.MANAGER_ID
              from EMPLOYEES E
                       join EMPLOYEES EM on (E.MANAGER_ID = EM.EMPLOYEE_ID)
              group by E.MANAGER_ID)

select COUNT(*) from EMPLOYEES where EMPLOYEE_ID in (select MANAGER_ID from EMPLOYEES);
```

Сложные запросы:
```sql
select DEPARTMENT_NAME, MIN(SALARY), MAX(SALARY)
    from (select SALARY, DEPARTMENT_NAME
              from EMPLOYEES E
                       join DEPARTMENTS D on (E.DEPARTMENT_ID = D.DEPARTMENT_ID))
    group by DEPARTMENT_NAME
    having MAX(SALARY) > (select 2 * 5000 from DUAL)
           --and MIN(SALARY) < (select SALARY from EMPLOYEES where EMPLOYEE_ID = 133)
    order by DEPARTMENT_NAME;
```

### Single row subqueries
Возвращают одну строку.
### SCALAR Single row subqueries
Возвращает одну строку и один столбец.
**Данный тип subquary можно использовать везде, где требуется одно значение.** То есть он возвращает одно значение.

```sql
select FIRST_NAME, LAST_NAME from EMPLOYEES where salary < ((select max(salary) from employees) / 5);
```

### Multiple row subqueries
Возвращают несколько строк. Для таких запросов обычно используется IN, NOT IN, ANY, ALL:
```sql
select FIRST_NAME, LAST_NAME, salary from EMPLOYEES
where job_id in (select job_id from jobs where MIN_SALARY > 8000)
```
*Не используйте NOT IN, если вы не уверены, что ваш поздапрос не вернет null значений.*


**Аналогом операторов сравнения больше/меньше(> и <) выступает оператор ==ANY== и ==ALL==
#### ANY
\- соответствие хотя бы 1 значению из вложенного селекта
```sql
select FIRST_NAME, LAST_NAME, SALARY
    from EMPLOYEES
    where SALARY > any (select SALARY from EMPLOYEES where DEPARTMENT_ID = 100) order by FIRST_NAME;
--means:
select FIRST_NAME, LAST_NAME, SALARY
    from EMPLOYEES
    where SALARY > (select min(SALARY) from EMPLOYEES where DEPARTMENT_ID = 100) order by FIRST_NAME;
```

#### ALL
\- соответсвие всем значений из вложенного селекта
```sql
select FIRST_NAME, LAST_NAME, SALARY
    from EMPLOYEES
    where SALARY > all (select SALARY from EMPLOYEES where DEPARTMENT_ID = 100);
	
--means:
select FIRST_NAME, LAST_NAME, SALARY
    from EMPLOYEES
    where SALARY > (select max(SALARY) from EMPLOYEES where DEPARTMENT_ID = 100);
```
### Correlated subqueries
\- поздапрос, в котором подзапрос связан с внешним запросом. Этот запрос выполняется каждый раз, что может потребовать много времени.

Выведем имена тех, у кого зарплата больше средней зарплаты в их департаменте:
```sql
select e1.FIRST_NAME, salary from EMPLOYEES e1
where e1.SALARY > (select avg(e2.salary) from EMPLOYEES e2 where e2.DEPARTMENT_ID = e1.DEPARTMENT_ID)
```
### Nested subqueries
```sql
select FIRST_NAME, LAST_NAME, salary from EMPLOYEES where DEPARTMENT_ID in (select DEPARTMENT_ID from DEPARTMENTS where
    LOCATION_ID in (select LOCATION_ID from LOCATIONS where COUNTRY_ID = (select COUNTRY_ID from COUNTRIES where COUNTRY_NAME like 'United Kingdom')))
```


# SUBQUERY with INSERT
[[INSERT#SUBQUERY]]