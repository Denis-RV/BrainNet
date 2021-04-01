==AVG(`{DISTINCT|ALL}`expression)== - вычисляет среднее арифметическое. Работает только с числами.

***Примеры:***
```sql
select AVG(SALARY) from EMPLOYEES; \--select sum(salary)/count(\*) from EMPLOYEES;  
select AVG(SALARY)  
    from EMPLOYEES  
    where JOB\_ID \= 'IT\_PROG';  
select AVG(sysdate \- hire\_date) / 365 from EMPLOYEES;
```
---
*tags:* #database, #sql, #sqlFunction #multiple-row_func 