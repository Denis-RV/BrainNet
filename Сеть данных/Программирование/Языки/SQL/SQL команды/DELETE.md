# DELETE
*теги:* #базы_данных, #sql/command/DBdml 
*описание:* удаление строк в таблицах. Удалять можно либо одну строку, либо несколько, но нельзя удалять значения в строках. В отличие от [[TRUNCATE]], delete долго удаляет строки.

---

## Шаблон:
>DELETE
FROM table_name
WHERE condition(s);


**Если неуказать where condition(s), то удаяляться ==все строки==.**

Примеры:
```sql
delete from new_emps;
insert into new_emps (select EMPLOYEE_ID, FIRST_NAME, HIRE_DATE, JOB_ID from EMPLOYEES);

delete from NEW_EMPS where EMP_ID = 210;
delete from NEW_EMPS where job like '%CLERK%' or name is null;
```

## Subquery 
**Шаблон:**
>DELETE
FROM table_name
WHERE condition = subquery;


```sql
delete from NEW_EMPS
    where JOB in (select JOB_ID
        from EMPLOYEES
         where DEPARTMENT_ID in
          	(select DEPARTMENT_ID from DEPARTMENTS where MANAGER_ID = 100));
```