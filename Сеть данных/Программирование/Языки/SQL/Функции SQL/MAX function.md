==MAX({DISTINCT|ALL} expression)== - максимум числа, даты или текста.

***Примеры:***
```sql
select MAX(LENGTH(FIRST\_NAME)), MIN(LENGTH(FIRST\_NAME)) from EMPLOYEES;  
select MAX(FIRST\_NAME), MIN(FIRST\_NAME) from EMPLOYEES;  
select MAX(SALARY), MIN(SALARY) from EMPLOYEES;  
select MAX(HIRE\_DATE), MIN(HIRE\_DATE) from EMPLOYEES;  
  
select COUNT(SALARY) as COUNT_, SUM(SALARY) as SUM_,
	AVG(SALARY) as AVG_, MAX(SALARY)   as MAX_, MIN(SALARY) as MIN_  
    from EMPLOYEES;
```
---
*tags:* #database, #sql, #sqlFunction #multiple-row_func 