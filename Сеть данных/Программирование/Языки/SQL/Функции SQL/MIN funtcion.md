==MIN({DISTINCT|ALL} expression)== - миниум числа, даты или текста.

***Примеры:***
```sql
select MAX(LENGTH(FIRST\_NAME)), MIN(LENGTH(FIRST\_NAME)) from EMPLOYEES;  
select MAX(FIRST\_NAME), MIN(FIRST\_NAME) from EMPLOYEES;  
select MAX(SALARY), MIN(SALARY) from EMPLOYEES;  
select MAX(HIRE\_DATE), MIN(HIRE\_DATE) from EMPLOYEES;  
  
select COUNT(SALARY) as COUNT\_, SUM(SALARY) as SUM\_, AVG(SALARY) as AVG\_,  
 MAX(SALARY)   as MAX\_, MIN(SALARY) as MIN\_  
    from EMPLOYEES;
```
---
*tags:* #database, #sql, #sqlFunction #multiple-row_func 