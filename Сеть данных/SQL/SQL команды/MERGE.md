# MERGE
*tags:* #database, #sql, #DBdml 
*description:* объединение команд. 

---

## Шаблоны
Одни из вариантов:

>MERGE INTO table_name1 t1
USING{table_name2|subquery} t2
ON (t1.column = t2.column)
WHEN MATCHED THEN 
`UPDATE SET column = value 
DELETE WHERE condition `
WHEN NOT MATCHED THEN 
`INSERT (value1,value2)
VALUES(columt1, colum2)`;

Пример:
```sql
merge into NEW_EMPS NE
using EMPLOYEES E
on (NE.EMP_ID = E.EMPLOYEE_ID)
when matched then
    update set NE.START_DATE = SYSDATE
    delete where NE.JOB like '%IT%'
when not matched then
    insert (EMP_ID, NAME, START_DATE, JOB) values (EMPLOYEE_ID, LAST_NAME, HIRE_DATE, JOB_ID)
```